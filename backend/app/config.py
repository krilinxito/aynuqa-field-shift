"""Configuración de la API.

Las rutas relativas se resuelven contra la carpeta `backend/`, que es desde
donde se ejecuta uvicorn según el README.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Aynuqa Field Shift API"
    version: str = "0.1.0"

    database_path: str = "data/app.db"
    ml_outputs_dir: str = "../ml/outputs"
    contracts_dir: str = "../contracts"

    admin_token: str = ""
    llm_api_key: str = ""
    llm_model: str = ""

    cors_origins: str = "*"

    def path(self, value: str) -> Path:
        path = Path(value).expanduser()
        if path.is_absolute():
            return path
        return (BACKEND_DIR / path).resolve()

    @property
    def database_file(self) -> Path:
        return self.path(self.database_path)

    @property
    def ml_outputs(self) -> Path:
        return self.path(self.ml_outputs_dir)

    @property
    def contracts(self) -> Path:
        return self.path(self.contracts_dir)

    @property
    def cors_origin_list(self) -> list[str]:
        value = self.cors_origins.strip()
        if value == "*":
            return ["*"]
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
