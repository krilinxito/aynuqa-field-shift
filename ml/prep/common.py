"""Rutas, zonas y utilidades compartidas por los scripts de prep/."""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ML_DIR = Path(__file__).resolve().parents[1]
RAW = ML_DIR / "data" / "raw"
INTERIM = ML_DIR / "data" / "interim"
APPEEARS = RAW / "appeears"

M_PER_DEG_LAT = 111_320.0
FIRST_SEASON = 2000          # campana 2000-01
PREDICTION_SEASON = 2026     # campana 2026-27, la que se predice


def load_zones() -> list[dict]:
    return json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]


def m_per_deg_lon(lat: float) -> float:
    return M_PER_DEG_LAT * math.cos(math.radians(lat))


def season_label(year: int) -> str:
    """2015 -> '2015-16' (julio de 2015 a junio de 2016)."""
    return f"{year}-{(year + 1) % 100:02d}"


def season_start(date: pd.Timestamp) -> int:
    """Anio en que empieza la campana (julio a junio) que contiene esa fecha."""
    return date.year if date.month >= 7 else date.year - 1


def zscore(values: pd.Series) -> pd.Series:
    """Anomalia en desviaciones estandar respecto a todos los valores disponibles."""
    std = values.std(ddof=1)
    if not np.isfinite(std) or std == 0:
        return values * np.nan
    return (values - values.mean()) / std


def find_grid(pattern: str, zone: dict) -> Path | None:
    """Archivo NetCDF de AppEEARS (de cualquier pedido) cuya grilla contiene el centro de la zona.

    AppEEARS numera los archivos por el orden de las areas del pedido (aid0001, ...), que cambia
    entre pedidos; por eso se identifica la zona por coordenadas y no por el nombre.
    """
    for path in sorted(APPEEARS.glob(pattern)):
        with xr.open_dataset(path) as ds:
            lat, lon = ds["lat"].values, ds["lon"].values
            if lat.min() <= zone["lat"] <= lat.max() and lon.min() <= zone["lon"] <= lon.max():
                return path
    return None


def pixels_in(lat: np.ndarray, lon: np.ndarray, bounds: tuple[float, float, float, float]):
    """Mascaras de filas y columnas cuyos centros caen dentro de (oeste, sur, este, norte)."""
    w, s, e, n = bounds
    return (lat >= s) & (lat <= n), (lon >= w) & (lon <= e)
