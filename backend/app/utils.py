"""Utilidades compartidas: hora de Bolivia y etiquetas del contrato."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

BOLIVIA_TZ = ZoneInfo("America/La_Paz")


def now_bolivia() -> datetime:
    return datetime.now(BOLIVIA_TZ)


def iso_now() -> str:
    return now_bolivia().isoformat(timespec="seconds")


def confidence_label(value: float) -> str:
    """Etiqueta del contrato: baja < 0.4, media <= 0.7, alta > 0.7."""
    if value < 0.4:
        return "baja"
    if value <= 0.7:
        return "media"
    return "alta"


def risk_level(score: float) -> str:
    """Nivel del contrato: low < 0.33, medium < 0.66, high en otro caso."""
    if score < 0.33:
        return "low"
    if score < 0.66:
        return "medium"
    return "high"


def current_month() -> str:
    return now_bolivia().strftime("%Y-%m")


def month_add(month: str, delta: int) -> str:
    year, month_number = (int(part) for part in month.split("-"))
    month_number += delta
    year += (month_number - 1) // 12
    month_number = (month_number - 1) % 12 + 1
    return f"{year:04d}-{month_number:02d}"
