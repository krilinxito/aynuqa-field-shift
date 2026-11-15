"""Simulador determinista de sensores de campo.

Cada valor se calcula a partir de (sector_id, ts) con la semilla fija 42.
La misma hora devuelve siempre el mismo valor, para que las gráficas no salten.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timedelta

from app.utils import BOLIVIA_TZ, now_bolivia

# Eventos programados que se repiten cada día dentro de las últimas 48 horas.
FROST_SECTOR = "S1"
WATER_STRESS_SECTOR = "S2"


class SensorSimulator:
    def generate(
        self,
        sector_id: str,
        hours: int,
        now: datetime | None = None,
    ) -> dict:
        end = now or now_bolivia()
        if end.tzinfo is None:
            end = end.replace(tzinfo=BOLIVIA_TZ)
        end = end.astimezone(BOLIVIA_TZ)
        end = end.replace(minute=(end.minute // 30) * 30, second=0, microsecond=0)
        start = end - timedelta(hours=hours)

        readings: list[dict] = []
        timestamp = start
        while timestamp <= end:
            readings.append(self._reading(sector_id, timestamp))
            timestamp += timedelta(minutes=30)

        for index, reading in enumerate(readings):
            reading["frost_alert"] = reading["air_temp_c"] <= 0.0
            stressed = (
                reading["soil_moisture_pct"] < 12.0
                and reading["canopy_temp_delta_c"] > 2.5
            )
            reading["_stressed"] = stressed
            previous = readings[max(0, index - 2) : index + 1]
            reading["water_stress_alert"] = (
                len(previous) == 3 and all(row["_stressed"] for row in previous)
            )
        for reading in readings:
            reading.pop("_stressed", None)

        return {
            "updated_at": end.isoformat(timespec="seconds"),
            "sector_id": sector_id,
            "hours": hours,
            "is_simulated": True,
            "readings": readings,
        }

    def _reading(self, sector_id: str, timestamp: datetime) -> dict:
        rng = random.Random(f"42|{sector_id}|{timestamp.isoformat()}")
        hour = timestamp.hour + timestamp.minute / 60.0

        # Ciclo diario: mínimo cerca de las 05:00, máximo cerca de las 14:00.
        base_temp = 8.6 - 7.4 * math.cos(2 * math.pi * (hour - 5.0) / 18.0)
        temp = base_temp + rng.uniform(-0.5, 0.5)
        if sector_id == FROST_SECTOR and 4.0 <= hour <= 6.5:
            # Helada programada, más marcada que el ciclo normal.
            temp -= 5.5
        temp = _clamp(temp, -5.0, 16.0)

        # Humedad de suelo: variación lenta, en porcentaje.
        base_soil = 18.0 + 6.0 * math.sin(2 * math.pi * (hour - 8.0) / 24.0)
        soil = base_soil + rng.uniform(-0.5, 0.5)
        if sector_id == WATER_STRESS_SECTOR and 11.0 <= hour <= 16.0:
            soil = 10.7 + rng.uniform(-0.3, 0.3)
        soil = _clamp(soil, 10.0, 35.0)

        # Diferencia de temperatura de dosel: más alta al mediodía.
        base_canopy = 1.5 + 2.0 * math.sin(2 * math.pi * (hour - 8.0) / 24.0)
        canopy = base_canopy + rng.uniform(-0.3, 0.3)
        if sector_id == WATER_STRESS_SECTOR and 11.0 <= hour <= 16.0:
            canopy = 3.0 + rng.uniform(-0.2, 0.2)
        canopy = _clamp(canopy, -1.0, 4.0)

        return {
            "ts": timestamp.isoformat(timespec="seconds"),
            "soil_moisture_pct": round(soil, 1),
            "air_temp_c": round(temp, 1),
            "canopy_temp_delta_c": round(canopy, 1),
            "frost_alert": False,
            "water_stress_alert": False,
            "is_simulated": True,
        }


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
