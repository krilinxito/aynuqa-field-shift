"""Crea los sectores simulados de cada zona con su terreno de NASADEM -> data/interim/sectors.geojson.

Uso, desde ml/:  python prep/sectors.py

Los limites y la rotacion son simulados (is_simulated: true), pero siguen lo documentado para la
aynuqa de Pumani por IBTA-ORSTOM en los anios 90: 13 sectores, cada uno se cultiva 3 anios y
descansa 10, de modo que cada anio hay 3 sectores en cultivo y 10 en descanso.

Cada sector es un cuadrado de 750 m (unos 9 pixeles de MODIS). El punto de zones.json es el
pueblo, asi que los sectores se ubican alrededor de el, a mas de 1,25 km, para no caer sobre casas.
Se numeran en sentido horario desde el norte, y la rotacion avanza en ese mismo orden, como en
una aynuqa real, donde la comunidad abre los sectores en una secuencia fija.
"""
import json
import math

import numpy as np
import xarray as xr

from common import INTERIM, M_PER_DEG_LAT, PREDICTION_SEASON, find_grid, load_zones, m_per_deg_lon, pixels_in

SECTOR_M = 750
N_SECTORS = 13
CULTIVATED_YEARS, RESTING_YEARS = 3, 10
CYCLE = CULTIVATED_YEARS + RESTING_YEARS
MIN_DISTANCE_M = 1250   # distancia minima al pueblo
GRID_STEPS = 6          # celdas candidatas hasta 6 x 750 m del centro en cada eje


def sector_ids() -> list[str]:
    return [f"S{i + 1}" for i in range(N_SECTORS)]


def rotation_offsets(zone_id: str) -> dict[str, int]:
    """Fase de cada sector en el ciclo: S1 empieza a cultivarse, S2 el anio siguiente, etc.

    Con 13 sectores y un ciclo de 13 anios, cada anio hay exactamente 3 sectores en cultivo.
    Cada zona arranca en un punto distinto del ciclo (derivado de su id), sin otra importancia.
    """
    start = sum(zone_id.encode()) % CYCLE
    return {sid: (start - i) % CYCLE for i, sid in enumerate(sector_ids())}


def rotation_state(offset: int, season_year: int) -> tuple[str, int]:
    """Estado y anios en ese estado al empezar la campana season_year."""
    phase = (season_year + offset) % CYCLE
    if phase < CULTIVATED_YEARS:
        return "cultivated", phase + 1
    return "resting", phase - CULTIVATED_YEARS + 1


def sector_bounds(zone: dict) -> dict[str, tuple[float, float, float, float]]:
    """(oeste, sur, este, norte) de cada sector, numerados en sentido horario desde el norte."""
    dlat = SECTOR_M / M_PER_DEG_LAT
    dlon = SECTOR_M / m_per_deg_lon(zone["lat"])
    cells = []
    for row in range(-GRID_STEPS, GRID_STEPS + 1):
        for col in range(-GRID_STEPS, GRID_STEPS + 1):
            distance = math.hypot(row, col) * SECTOR_M
            if distance >= MIN_DISTANCE_M:
                cells.append((distance, row, col))
    cells.sort()
    chosen = cells[:N_SECTORS]
    # Orden horario desde el norte: row crece hacia el norte y col hacia el este.
    chosen.sort(key=lambda c: math.atan2(c[2], c[1]) % (2 * math.pi))
    bounds = {}
    for sid, (_, row, col) in zip(sector_ids(), chosen):
        clat, clon = zone["lat"] + row * dlat, zone["lon"] + col * dlon
        bounds[sid] = (round(clon - dlon / 2, 6), round(clat - dlat / 2, 6),
                       round(clon + dlon / 2, 6), round(clat + dlat / 2, 6))
    return bounds


def terrain(dem_path, bounds) -> dict[str, float | None]:
    """Altitud media, pendiente media y orientacion de la pendiente media del sector."""
    empty = {"elevation_m": None, "slope_pct": None, "aspect_deg": None}
    if dem_path is None:
        return empty
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
        return empty
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
        print(f"{zone['id']}: {N_SECTORS} sectores, terreno {'de ' + dem.parent.name if dem else 'pendiente (falta NASADEM)'}")
    INTERIM.mkdir(parents=True, exist_ok=True)
    out = INTERIM / "sectors.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, indent=1) + "\n", encoding="utf-8")
    print(f"{len(features)} sectores en {out}")


if __name__ == "__main__":
    main()
