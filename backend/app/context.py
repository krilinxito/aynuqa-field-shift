"""Contexto compartido de la aplicación."""

from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import Request

from app.config import Settings
from app.db import Database
from app.loader import MLLoader
from app.services.chat import ChatService
from app.services.history import HistoryService
from app.services.nasa_power import NasaPowerClient
from app.services.sensors import SensorSimulator


@dataclass
class AppContext:
    settings: Settings
    db: Database = field(init=False)
    loader: MLLoader = field(init=False)
    sensors: SensorSimulator = field(init=False)
    power: NasaPowerClient = field(init=False)
    history: HistoryService = field(init=False)
    chat: ChatService = field(init=False)

    def __post_init__(self) -> None:
        self.db = Database(self.settings.database_file)
        self.loader = MLLoader(self.settings, self.db)
        self.sensors = SensorSimulator()
        self.power = NasaPowerClient(self.settings, self.db)
        self.history = HistoryService(self)
        self.chat = ChatService(self)

    def startup(self) -> None:
        self.db.initialize()
        self.loader.load_all()

    def shutdown(self) -> None:
        close = getattr(self.power, "close", None)
        if callable(close):
            close()


def get_ctx(request: Request) -> AppContext:
    return request.app.state.ctx
