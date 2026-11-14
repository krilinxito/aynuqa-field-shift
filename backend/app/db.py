"""Acceso a SQLite.

Back solo guarda y sirve lo que exporta ML. Las tablas siguen los nombres del
README de backend: predictions, history, backtest, analogs y power_cache.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path
from typing import Any

from app.utils import iso_now

logger = logging.getLogger(__name__)

MOCK_SOURCES = {
    "predictions": "mock",
    "history": "mock",
    "backtest": "mock",
    "analogs": "mock",
}


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=15)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = self.connect()
        try:
            try:
                connection.execute("PRAGMA journal_mode=WAL")
            except sqlite3.DatabaseError:
                logger.warning("No se pudo activar WAL en SQLite")
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS predictions (
                    scenario TEXT PRIMARY KEY
                        CHECK (scenario IN ('normal', 'nino')),
                    payload TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    data_source TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS history_meta (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    updated_at TEXT NOT NULL,
                    data_source TEXT NOT NULL,
                    from_date TEXT NOT NULL,
                    to_date TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS history (
                    sector_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    ndvi REAL,
                    precip_mm REAL,
                    soil_moisture REAL,
                    temp_c REAL,
                    roni REAL,
                    PRIMARY KEY (sector_id, date)
                );

                CREATE TABLE IF NOT EXISTS backtests (
                    event TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    data_source TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS analogs (
                    sector_id TEXT NOT NULL,
                    event TEXT NOT NULL,
                    similarity REAL NOT NULL,
                    payload TEXT NOT NULL,
                    PRIMARY KEY (sector_id, event)
                );

                CREATE TABLE IF NOT EXISTS power_cache (
                    lat REAL NOT NULL,
                    lon REAL NOT NULL,
                    parameter TEXT NOT NULL,
                    date TEXT NOT NULL,
                    value REAL,
                    fetched_at TEXT NOT NULL,
                    PRIMARY KEY (lat, lon, parameter, date)
                );

                CREATE TABLE IF NOT EXISTS meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                """
            )
            connection.commit()
        finally:
            connection.close()

    def replace_dataset(
        self,
        *,
        predictions: dict[str, dict[str, Any]],
        history: dict[str, Any],
        backtests: dict[str, dict[str, Any]],
        analogs: list[dict[str, Any]],
        sources: dict[str, str],
        updated_at: str,
    ) -> None:
        """Reemplaza todo el conjunto de datos en una sola transacción."""
        connection = self.connect()
        try:
            with connection:
                for table in (
                    "predictions",
                    "history_meta",
                    "history",
                    "backtests",
                    "analogs",
                    "meta",
                ):
                    connection.execute(f"DELETE FROM {table}")

                for scenario, payload in predictions.items():
                    connection.execute(
                        """
                        INSERT INTO predictions
                            (scenario, payload, updated_at, data_source)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            scenario,
                            json.dumps(payload, ensure_ascii=False),
                            payload.get("updated_at", updated_at),
                            payload.get("data_source", sources.get("predictions", "mock")),
                        ),
                    )

                connection.execute(
                    """
                    INSERT INTO history_meta
                        (id, updated_at, data_source, from_date, to_date)
                    VALUES (1, ?, ?, ?, ?)
                    """,
                    (
                        history["updated_at"],
                        history["data_source"],
                        history["from"],
                        history["to"],
                    ),
                )
                rows = []
                for sector_id, series in history["sectors"].items():
                    for row in series:
                        rows.append(
                            (
                                sector_id,
                                row["date"],
                                row.get("ndvi"),
                                row.get("precip_mm"),
                                row.get("soil_moisture"),
                                row.get("temp_c"),
                                row.get("roni"),
                            )
                        )
                connection.executemany(
                    """
                    INSERT INTO history
                        (sector_id, date, ndvi, precip_mm, soil_moisture, temp_c, roni)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    rows,
                )

                for event, payload in backtests.items():
                    connection.execute(
                        """
                        INSERT INTO backtests
                            (event, payload, updated_at, data_source)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            event,
                            json.dumps(payload, ensure_ascii=False),
                            payload.get("updated_at", updated_at),
                            payload.get("data_source", sources.get("backtest", "mock")),
                        ),
                    )

                for precedent in analogs:
                    connection.execute(
                        """
                        INSERT INTO analogs
                            (sector_id, event, similarity, payload)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            precedent["sector_id"],
                            precedent["event"],
                            precedent["similarity"],
                            json.dumps(precedent, ensure_ascii=False),
                        ),
                    )

                connection.execute(
                    "INSERT INTO meta (key, value) VALUES (?, ?)",
                    ("sources", json.dumps(sources, ensure_ascii=False)),
                )
                connection.execute(
                    "INSERT INTO meta (key, value) VALUES (?, ?)",
                    ("updated_at", updated_at),
                )
        finally:
            connection.close()

    def get_meta(self) -> dict[str, Any]:
        connection = self.connect()
        try:
            rows = connection.execute("SELECT key, value FROM meta").fetchall()
        finally:
            connection.close()
        values = {row["key"]: row["value"] for row in rows}
        try:
            sources = json.loads(values.get("sources", "{}"))
        except json.JSONDecodeError:
            sources = {}
        merged = {**MOCK_SOURCES, **sources}
        return {
            "sources": {
                key: merged.get(key, "mock")
                for key in ("predictions", "history", "backtest", "analogs")
            },
            "updated_at": values.get("updated_at", iso_now()),
        }

    def get_predictions(self, scenario: str) -> dict[str, Any] | None:
        connection = self.connect()
        try:
            row = connection.execute(
                "SELECT payload FROM predictions WHERE scenario = ?",
                (scenario,),
            ).fetchone()
        finally:
            connection.close()
        return json.loads(row["payload"]) if row else None

    def get_sector(self, sector_id: str, scenario: str) -> dict[str, Any] | None:
        payload = self.get_predictions(scenario)
        if not payload:
            return None
        for sector in payload.get("sectors", []):
            if sector.get("id") == sector_id:
                return sector
        return None

    def get_history_meta(self) -> dict[str, Any] | None:
        connection = self.connect()
        try:
            row = connection.execute(
                """
                SELECT updated_at, data_source, from_date, to_date
                FROM history_meta WHERE id = 1
                """
            ).fetchone()
        finally:
            connection.close()
        if not row:
            return None
        return {
            "updated_at": row["updated_at"],
            "data_source": row["data_source"],
            "from": row["from_date"],
            "to": row["to_date"],
        }

    def get_history(
        self,
        sector_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> list[dict[str, Any]]:
        query = (
            "SELECT date, ndvi, precip_mm, soil_moisture, temp_c, roni "
            "FROM history WHERE sector_id = ?"
        )
        params: list[Any] = [sector_id]
        if from_date:
            query += " AND date >= ?"
            params.append(from_date)
        if to_date:
            query += " AND date <= ?"
            params.append(to_date)
        query += " ORDER BY date"
        connection = self.connect()
        try:
            rows = connection.execute(query, params).fetchall()
        finally:
            connection.close()
        return [
            {
                "date": row["date"],
                "ndvi": row["ndvi"],
                "precip_mm": row["precip_mm"],
                "soil_moisture": row["soil_moisture"],
                "temp_c": row["temp_c"],
                "roni": row["roni"],
            }
            for row in rows
        ]

    def get_history_tail(self, sector_id: str, limit: int = 12) -> list[dict[str, Any]]:
        connection = self.connect()
        try:
            rows = connection.execute(
                """
                SELECT date, ndvi, precip_mm, soil_moisture, temp_c, roni
                FROM history WHERE sector_id = ?
                ORDER BY date DESC LIMIT ?
                """,
                (sector_id, limit),
            ).fetchall()
        finally:
            connection.close()
        return [
            {
                "date": row["date"],
                "ndvi": row["ndvi"],
                "precip_mm": row["precip_mm"],
                "soil_moisture": row["soil_moisture"],
                "temp_c": row["temp_c"],
                "roni": row["roni"],
            }
            for row in reversed(rows)
        ]

    def sector_ids(self) -> list[str]:
        connection = self.connect()
        try:
            rows = connection.execute(
                "SELECT DISTINCT sector_id FROM history"
            ).fetchall()
        finally:
            connection.close()
        ids = [row["sector_id"] for row in rows]
        return sorted(ids, key=lambda value: int(value[1:]) if value[1:].isdigit() else 0)

    def sector_exists(self, sector_id: str) -> bool:
        return sector_id in self.sector_ids()

    def get_backtest(self, event: str) -> dict[str, Any] | None:
        connection = self.connect()
        try:
            row = connection.execute(
                "SELECT payload FROM backtests WHERE event = ?",
                (event,),
            ).fetchone()
        finally:
            connection.close()
        return json.loads(row["payload"]) if row else None

    def get_best_analog(
        self, sector_id: str, event: str | None = None
    ) -> dict[str, Any] | None:
        query = "SELECT payload FROM analogs WHERE sector_id = ?"
        params: list[Any] = [sector_id]
        if event:
            query += " AND event = ?"
            params.append(event)
        query += " ORDER BY similarity DESC LIMIT 1"
        connection = self.connect()
        try:
            row = connection.execute(query, params).fetchone()
        finally:
            connection.close()
        return json.loads(row["payload"]) if row else None

    def get_power_rows(
        self,
        lat: float,
        lon: float,
        parameters: tuple[str, ...],
        start: str,
        end: str,
    ) -> dict[tuple[str, str], dict[str, Any]]:
        placeholders = ",".join("?" for _ in parameters)
        connection = self.connect()
        try:
            rows = connection.execute(
                f"""
                SELECT date, parameter, value, fetched_at
                FROM power_cache
                WHERE lat = ? AND lon = ? AND parameter IN ({placeholders})
                  AND date BETWEEN ? AND ?
                """,
                (lat, lon, *parameters, start, end),
            ).fetchall()
        finally:
            connection.close()
        return {
            (row["date"], row["parameter"]): {
                "value": row["value"],
                "fetched_at": row["fetched_at"],
            }
            for row in rows
        }

    def upsert_power_rows(
        self,
        lat: float,
        lon: float,
        rows: list[tuple[str, str, float | None, str]],
    ) -> None:
        if not rows:
            return
        connection = self.connect()
        try:
            with connection:
                connection.executemany(
                    """
                    INSERT INTO power_cache
                        (lat, lon, parameter, date, value, fetched_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(lat, lon, parameter, date)
                    DO UPDATE SET value = excluded.value,
                                  fetched_at = excluded.fetched_at
                    """,
                    [(lat, lon, *row) for row in rows],
                )
        finally:
            connection.close()
