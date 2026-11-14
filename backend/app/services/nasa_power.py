"""Cliente de NASA POWER con caché en SQLite.

Se usa para completar el mes actual del histórico cuando ML todavía no lo
incluyó. El histórico 2000-2025 es de ML; aquí solo se piden días recientes.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import Settings
from app.db import Database
from app.utils import now_bolivia

logger = logging.getLogger(__name__)

POWER_PARAMETERS = ("T2M", "PRECTOTCORR", "GWETROOT", "ALLSKY_SFC_SW_DWN")
MISSING_VALUE = -999.0


class NasaPowerClient:
    def __init__(
        self,
        settings: Settings,
        db: Database,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.settings = settings
        self.db = db
        self._owns_http = http_client is None
        self._http = http_client or httpx.Client(
            timeout=settings.nasa_power_timeout_s
        )

    def close(self) -> None:
        if self._owns_http:
            self._http.close()

    def get_daily(
        self,
        start: date | str,
        end: date | str,
        lat: float | None = None,
        lon: float | None = None,
    ) -> list[dict[str, Any]]:
        start_date = _as_date(start)
        end_date = _as_date(end)
        if start_date > end_date:
            return []
        latitude = _normalize_lat(
            self.settings.nasa_power_lat if lat is None else lat
        )
        longitude = round(
            self.settings.nasa_power_lon if lon is None else lon, 2
        )

        cached = self.db.get_power_rows(
            latitude,
            longitude,
            POWER_PARAMETERS,
            start_date.isoformat(),
            end_date.isoformat(),
        )
        if self._is_cache_complete(cached, start_date, end_date):
            return self._to_days(cached, start_date, end_date)

        try:
            fetched = self._fetch(latitude, longitude, start_date, end_date)
            self._store(latitude, longitude, fetched)
            for (day, parameter), value in fetched.items():
                cached[(day, parameter)] = {
                    "value": value,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
        except Exception as exc:  # noqa: BLE001 - la API externa no debe tumbar la app
            logger.warning("NASA POWER no respondió: %s", exc)
            if not cached:
                return []
        return self._to_days(cached, start_date, end_date)

    def _fetch(
        self,
        lat: float,
        lon: float,
        start: date,
        end: date,
    ) -> dict[tuple[str, str], float | None]:
        params = {
            "parameters": ",".join(POWER_PARAMETERS),
            "community": "AG",
            "latitude": lat,
            "longitude": lon,
            "start": start.strftime("%Y%m%d"),
            "end": end.strftime("%Y%m%d"),
            "format": "JSON",
        }
        response = self._http.get(self.settings.nasa_power_base_url, params=params)
        response.raise_for_status()
        payload = response.json()
        raw = payload.get("properties", {}).get("parameter", {})
        result: dict[tuple[str, str], float | None] = {}
        for parameter in POWER_PARAMETERS:
            for day, value in raw.get(parameter, {}).items():
                iso_day = f"{day[0:4]}-{day[4:6]}-{day[6:8]}"
                if value is None or value == MISSING_VALUE:
                    result[(iso_day, parameter)] = None
                else:
                    result[(iso_day, parameter)] = float(value)
        return result

    def _store(
        self,
        lat: float,
        lon: float,
        values: dict[tuple[str, str], float | None],
    ) -> None:
        fetched_at = datetime.now(timezone.utc).isoformat()
        rows = [
            (parameter, day, value, fetched_at)
            for (day, parameter), value in values.items()
        ]
        self.db.upsert_power_rows(lat, lon, rows)

    def _is_cache_complete(
        self,
        cached: dict[tuple[str, str], dict[str, Any]],
        start: date,
        end: date,
    ) -> bool:
        day = start
        while day <= end:
            for parameter in POWER_PARAMETERS:
                item = cached.get((day.isoformat(), parameter))
                if item is None or not _is_fresh(day, item["fetched_at"]):
                    return False
            day += timedelta(days=1)
        return True

    def _to_days(
        self,
        cached: dict[tuple[str, str], dict[str, Any]],
        start: date,
        end: date,
    ) -> list[dict[str, Any]]:
        days: list[dict[str, Any]] = []
        day = start
        while day <= end:
            iso_day = day.isoformat()
            row: dict[str, Any] = {"date": iso_day}
            for parameter in POWER_PARAMETERS:
                item = cached.get((iso_day, parameter))
                row[parameter] = item["value"] if item else None
            days.append(row)
            day += timedelta(days=1)
        return days


def _as_date(value: date | str) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


def _normalize_lat(lat: float) -> float:
    """Corrige la errata de latitud positiva y valida el altiplano."""
    lat = float(lat)
    if 16.0 <= lat <= 18.0:
        lat = -lat
    if not -18.0 <= lat <= -16.0:
        raise ValueError(f"Latitud fuera del altiplano: {lat}")
    return round(lat, 2)


def _is_fresh(day: date, fetched_at: str) -> bool:
    today = now_bolivia().date()
    if day < today - timedelta(days=90):
        return True
    try:
        fetched = datetime.fromisoformat(fetched_at)
    except ValueError:
        return False
    if fetched.tzinfo is None:
        fetched = fetched.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - fetched < timedelta(hours=24)
