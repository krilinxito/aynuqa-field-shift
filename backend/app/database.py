import json
import time
from datetime import datetime, timezone
from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS offline_snapshots (
    id TEXT PRIMARY KEY,
    dataset TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dataset, cache_key)
);
CREATE INDEX IF NOT EXISTS offline_snapshots_lookup
    ON offline_snapshots (dataset, cache_key);
"""

class SnapshotStore:
    def __init__(self, database_url: str) -> None:
        self.pool = ConnectionPool(database_url, min_size=1, max_size=5, open=False)

    def open(self) -> None:
        last_error: Exception | None = None
        for attempt in range(12):
            try:
                self.pool.open(wait=True, timeout=10)
                with self.pool.connection() as connection:
                    connection.execute(SCHEMA_SQL)
                return
            except Exception as error:  # Docker puede iniciar la API antes que Postgres.
                last_error = error
                if attempt == 11:
                    raise
                time.sleep(1)
        if last_error:
            raise last_error

    def close(self) -> None:
        self.pool.close()

    def replace_all(self, values: list[tuple[str, str, dict[str, Any]]]) -> None:
        """Reemplaza atómicamente las instantáneas con los datos actuales de SQLite."""
        with self.pool.connection() as connection:
            connection.execute("DELETE FROM offline_snapshots")
            for dataset, cache_key, payload in values:
                connection.execute(
                    """
                    INSERT INTO offline_snapshots (id, dataset, cache_key, payload, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        payload = EXCLUDED.payload,
                        updated_at = EXCLUDED.updated_at
                    """,
                    (
                        f"{dataset}:{cache_key}",
                        dataset,
                        cache_key,
                        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                        payload.get("updated_at") or datetime.now(timezone.utc),
                    ),
                )

    def get(self, dataset: str, cache_key: str) -> dict[str, Any] | None:
        with self.pool.connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                row = cursor.execute(
                    "SELECT payload FROM offline_snapshots WHERE dataset = %s AND cache_key = %s",
                    (dataset, cache_key),
                ).fetchone()
        return json.loads(row["payload"]) if row else None
