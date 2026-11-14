"""Crea los sectores simulados de cada zona con su terreno de NASADEM -> data/interim/sectors.geojson.

Uso, desde ml/:  python prep/sectors.py

Los limites y la rotacion son simulados (is_simulated: true). En cada zona hay 8 sectores
cuadrados de 750 m (unos 9 pixeles de MODIS), contiguos en 4 columnas y 2 filas, centrados
en el punto de zones.json. La rotacion sigue un ciclo de 3 anios de cultivo y 5 de descanso,
desfasado entre sectores, de modo que en cada campana hay 3 sectores cultivados y 5 en descanso.
"""
import json
import math
import random
import zlib

import numpy as np
import xarray as xr

from common import INTERIM, M_PER_DEG_LAT, PREDICTION_SEASON, find_grid, load_zones, m_per_deg_lon, pixels_in

SECTOR_M = 750
COLS, ROWS = 4, 2
CULTIVATED_YEARS, RESTING_YEARS = 3, 5
CYCLE = CULTIVATED_YEARS + RESTING_YEARS


def sector_ids() -> list[str]:
    return [f"S{i + 1}" for i in range(COLS * ROWS)]


def rotation_offsets(zone_id: str) -> dict[str, int]:
    """Fase de cada sector en el ciclo, fija para cada zona (semilla derivada del id)."""
    phases = list(range(CYCLE))
    random.Random(zlib.crc32(zone_id.encode())).shuffle(phases)
    return dict(zip(sector_ids(), phases))


def rotation_state(offset: int, season_year: int) -> tuple[str, int]:
    """Estado y anios en ese estado al empezar la campana season_year."""
    phase = (season_year + offset) % CYCLE
    if phase < CULTIVATED_YEARS:
        return "cultivated", phase + 1
    return "resting", phase - CULTIVATED_YEARS + 1


def sector_bounds(zone: dict) -> dict[str, tuple[float, float, float, float]]:
    """(oeste, sur, este, norte) de cada sector. S1 arriba a la izquierda, por filas."""
    dlat = SECTOR_M / M_PER_DEG_LAT
    dlon = SECTOR_M / m_per_deg_lon(zone["lat"])
    west = zone["lon"] - COLS * dlon / 2
    north = zone["lat"] + ROWS * dlat / 2
    bounds = {}
    for i, sid in enumerate(sector_ids()):
        row, col = divmod(i, COLS)
        w, n = west + col * dlon, north - row * dlat
        bounds[sid] = (round(w, 6), round(n - dlat, 6), round(w + dlon, 6), round(n, 6))
    return bounds


def terrain(dem_path, bounds) -> dict[str, float | None]:
    """Altitud media, pendiente media y orientacion de la pendiente media del sector."""
    if dem_path is None:
        return {"elevation_m": None, "slope_pct": None, "aspect_deg": None}
    with xr.open_dataset(dem_path) as ds:
        z = ds["NASADEM_HGT"].isel(time=0).values.astype(float)
        lat, lon = ds["lat"].values, ds["lon"].values
    dy = abs(lat[1] - lat[0]) * M_PER_DEG_LAT
    dx = abs(lon[1] - lon[0]) * m_per_deg_lon(float(lat.mean()))
    # Las filas van de norte a sur: la pendiente hacia el norte es la del eje 0 con signo cambiado.
    d_row, d_col = np.gradient(z)
    dz_north, dz_east = -d_row / dy, d_col / dx
    rows, cols = pixels_in(lat, lon, bounds)
    window = np.ix_(rows, cols)
    if not np.isfinite(z[window]).any():
        return {"elevation_m": None, "slope_pct": None, "aspect_deg": None}
    slope = np.hypot(dz_east[window], dz_north[window]) * 100
    east, north = np.nanmean(dz_east[window]), np.nanmean(dz_north[window])
    # La orientacion es hacia donde baja la pendiente, en grados desde el norte en sentido horario.
    aspect = math.degrees(math.atan2(-east, -north)) % 360
    return {
        "elevation_m": round(float(np.nanmean(z[window])), 1),
        "slope_pct": round(float(np.nanmean(slope)), 2),
        "aspect_deg": round(aspect, 1),
    }


def main() -> None:
    features = []
    for zone in load_zones():
        dem = find_grid("aynuqa_dem_*/NASADEM_NC.001_*.nc", zone)
        offsets = rotation_offsets(zone["id"])
        for sid, b in sector_bounds(zone).items():
            w, s, e, n = b
            status, years = rotation_state(offsets[sid], PREDICTION_SEASON)
            area_ha = (n - s) * M_PER_DEG_LAT * (e - w) * m_per_deg_lon((n + s) / 2) / 10_000
            features.append({
                "type": "Feature",
                "properties": {
                    "zone_id": zone["id"],
                    "sector_id": sid,
                    "display": zone["role"] == "target",
                    "area_ha": round(area_ha, 1),
                    **terrain(dem, b),
                    "rotation_status": status,
                    "rotation_years": years,
                    "is_simulated": True,
                },
                "geometry": {"type": "Polygon", "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]]},
            })
        print(f"{zone['id']}: {COLS * ROWS} sectores, terreno {'de ' + dem.parent.name if dem else 'pendiente (falta NASADEM)'}")
    INTERIM.mkdir(parents=True, exist_ok=True)
    out = INTERIM / "sectors.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, indent=1) + "\n", encoding="utf-8")
    print(f"{len(features)} sectores en {out}")


if __name__ == "__main__":
    main()
