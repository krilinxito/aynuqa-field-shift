"""Punto de entrada de la API."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.context import AppContext
from app.errors import install_error_handlers
from app.routers import admin, backtest, chat, health, report, sectors, speech_translate

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    ctx = AppContext(settings)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        ctx.startup()
        logger.info("API lista en el puerto 8000")
        try:
            yield
        finally:
            ctx.shutdown()

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        lifespan=lifespan,
    )
    app.state.ctx = ctx
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )
    install_error_handlers(app)
    app.include_router(health.router)
    app.include_router(sectors.router)
    app.include_router(backtest.router)
    app.include_router(chat.router)
    app.include_router(admin.router)
    app.include_router(report.router)
    app.include_router(speech_translate.router)
    return app


app = create_app()
