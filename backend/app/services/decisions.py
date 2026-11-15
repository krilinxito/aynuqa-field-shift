"""Decisiones de la comunidad: lo único que escribe el celular.

Con `DATABASE_URL` se guardan en PostgreSQL (y PowerSync las replica a todos
los celulares). Sin él, por ejemplo en las pruebas, en el SQLite del backend.
"""

from __future__ import annotations

import sqlite3
from typing import Any, Protocol

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

COLUMNS = (
    "id",
    "community_id",
    "sector_id",
    "scenario",
    "action",
    "recommended_action",
    "follows_recommendation",
    "note",
    "decided_at",
)

POSTGRES_SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    sector_id TEXT NOT NULL,
    scenario TEXT NOT NULL,
    action TEXT NOT NULL,
    recommended_action TEXT,
    follows_recommendation BOOLEAN NOT NULL,
    note TEXT,
    decided_at TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decisions_community
    ON decisions (community_id, sector_id);
"""

SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    sector_id TEXT NOT NULL,
    scenario TEXT NOT NULL,
    action TEXT NOT NULL,
    recommended_action TEXT,
    follows_recommendation INTEGER NOT NULL,
    note TEXT,
    decided_at TEXT NOT NULL
);
"""


class DecisionStore(Protocol):
    def initialize(self) -> None: ...
    def upsert(self, decision: dict[str, Any]) -> None: ...
    def delete(self, decision_id: str) -> None: ...
    def list(self, community_id: str, sector_id: str | None) -> list[dict[str, Any]]: ...


def _normalize(row: dict[str, Any]) -> dict[str, Any]:
    value = {key: row[key] for key in COLUMNS}
    value["follows_recommendation"] = bool(value["follows_recommendation"])
    return value


class PostgresDecisionStore:
    def __init__(self, pool: ConnectionPool) -> None:
        self.pool = pool

    def initialize(self) -> None:
        with self.pool.connection() as connection:
            connection.execute(POSTGRES_SCHEMA)

    def upsert(self, decision: dict[str, Any]) -> None:
        placeholders = ", ".join(["%s"] * len(COLUMNS))
        updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in COLUMNS[1:])
        with self.pool.connection() as connection:
            connection.execute(
                f"INSERT INTO decisions ({', '.join(COLUMNS)}) VALUES ({placeholders}) "
                f"ON CONFLICT (id) DO UPDATE SET {updates}, updated_at = now()",
                [decision[c] for c in COLUMNS],
            )

    def delete(self, decision_id: str) -> None:
        with self.pool.connection() as connection:
            connection.execute("DELETE FROM decisions WHERE id = %s", (decision_id,))

    def list(self, community_id: str, sector_id: str | None) -> list[dict[str, Any]]:
        query = f"SELECT {', '.join(COLUMNS)} FROM decisions WHERE community_id = %s"
        params: list[Any] = [community_id]
        if sector_id:
            query += " AND sector_id = %s"
            params.append(sector_id)
        query += " ORDER BY decided_at DESC"
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                rows = cursor.execute(query, params).fetchall()
        return [_normalize(row) for row in rows]


class SqliteDecisionStore:
    def __init__(self, connect) -> None:
        self.connect = connect

    def initialize(self) -> None:
        connection: sqlite3.Connection = self.connect()
        try:
            connection.executescript(SQLITE_SCHEMA)
        finally:
            connection.close()

    def upsert(self, decision: dict[str, Any]) -> None:
        placeholders = ", ".join(["?"] * len(COLUMNS))
        connection: sqlite3.Connection = self.connect()
        try:
            with connection:
                connection.execute(
                    f"INSERT OR REPLACE INTO decisions ({', '.join(COLUMNS)}) "
                    f"VALUES ({placeholders})",
                    [decision[c] for c in COLUMNS],
                )
        finally:
            connection.close()

    def delete(self, decision_id: str) -> None:
        connection: sqlite3.Connection = self.connect()
        try:
            with connection:
                connection.execute("DELETE FROM decisions WHERE id = ?", (decision_id,))
        finally:
            connection.close()

    def list(self, community_id: str, sector_id: str | None) -> list[dict[str, Any]]:
        query = f"SELECT {', '.join(COLUMNS)} FROM decisions WHERE community_id = ?"
        params: list[Any] = [community_id]
        if sector_id:
            query += " AND sector_id = ?"
            params.append(sector_id)
        query += " ORDER BY decided_at DESC"
        connection: sqlite3.Connection = self.connect()
        try:
            rows = connection.execute(query, params).fetchall()
        finally:
            connection.close()
        return [_normalize(dict(row)) for row in rows]
