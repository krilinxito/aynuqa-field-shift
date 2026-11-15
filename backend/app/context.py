"""Contexto compartido de la aplicación."""

from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import Request

from app.config import Settings
from app.database import SnapshotStore
from app.db import Database
from app.loader import MLLoader
from app.security import TokenIssuer
from app.services.chat import ChatService
from app.services.decisions import (
    DecisionStore,
    PostgresDecisionStore,
    SqliteDecisionStore,
)
from app.services.history import HistoryService
from app.services.local_tts import LocalTts
from app.services.sensors import SensorSimulator


@dataclass
class AppContext:
    settings: Settings
    db: Database = field(init=False)
    loader: MLLoader = field(init=False)
    sensors: SensorSimulator = field(init=False)
    history: HistoryService = field(init=False)
    chat: ChatService = field(init=False)
    snapshots: SnapshotStore | None = field(init=False)
    tokens: TokenIssuer = field(init=False)
    local_tts: LocalTts = field(init=False)
    decisions: DecisionStore = field(init=False)

    def __post_init__(self) -> None:
        self.db = Database(self.settings.database_file)
        self.loader = MLLoader(self.settings, self.db)
        self.sensors = SensorSimulator()
        self.history = HistoryService(self)
        self.chat = ChatService(self)
        self.snapshots = (
            SnapshotStore(self.settings.database_url)
            if self.settings.database_url
            else None
        )
        self.decisions = (
            PostgresDecisionStore(self.snapshots.pool)
            if self.snapshots
            else SqliteDecisionStore(self.db.connect)
        )
        self.local_tts = LocalTts(
            self.settings.path(self.settings.tts_cache_dir),
            self.settings.tts_local_models,
        )
        self.tokens = TokenIssuer(
            self.settings.powersync_audience,
            self.settings.powersync_token_minutes,
        )

    def startup(self) -> None:
        self.db.initialize()
        self.loader.load_all()
        self.local_tts.warm_up()
        if self.snapshots:
            self.snapshots.open()
            self.sync_offline_snapshots()
        self.decisions.initialize()

    def shutdown(self) -> None:
        if self.snapshots:
            self.snapshots.close()

    def sync_offline_snapshots(self) -> None:
        """Copia al origen PowerSync el último conjunto validado por el backend."""
        if not self.snapshots:
            return

        meta = self.db.get_meta()
        values: list[tuple[str, str, dict]] = [
            (
                "health",
                "global",
                {
                    "status": "ok",
                    "version": self.settings.version,
                    "updated_at": meta["updated_at"],
                    "sources": meta["sources"],
                },
            )
        ]
        for scenario in ("normal", "nino"):
            payload = self.db.get_predictions(scenario)
            if payload:
                values.append(("sectors", scenario, payload))
        for sector_id in self.db.sector_ids():
            values.append(("history", sector_id, self.history.get(sector_id)))
            values.append(("sensors", sector_id, self.sensors.generate(sector_id, 168)))
        for event in ("2015-16", "2020-22", "2023-24"):
            payload = self.db.get_backtest(event)
            if payload:
                values.append(("backtest", event, payload))
        self.snapshots.replace_all(values)


def get_ctx(request: Request) -> AppContext:
    return request.app.state.ctx
