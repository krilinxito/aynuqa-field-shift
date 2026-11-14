"""Una fila por sector y campana con lo que se sabe al decidir -> data/interim/features.csv.

Uso, desde ml/:  python prep/features.py   (despues de prep/monthly.py)

Definiciones en ml/TABLAS.md. Las anomalias estan en desviaciones estandar respecto a todas
las campanas disponibles: por sector para el NDVI y por zona para el clima.
"""
import json
import math

import numpy as np
import pandas as pd

from common import FIRST_SEASON, INTERIM, PREDICTION_SEASON, season_label, zscore
from sectors import rotation_offsets, rotation_state

RONI_LAGS = 7          # roni_lag_0 ... roni_lag_6
MIN_YEARS_FOR_TREND = 10
RONI_LAG0_MONTH = 8   # JAS, centrada en agosto: la ultima temporada que NOAA publica a inicios de octubre
COLUMNS = (
    ["zone_id", "sector_id", "season", "target_ndvi_anom", "is_prediction_row"]
    + [f"roni_lag_{k}" for k in range(RONI_LAGS)]
    + ["precip_anom_3m", "precip_anom_12m", "temp_anom_3m", "soil_moisture_anom",
       "ndvi_anom_prev_peak", "ndvi_anom_sep", "elevation_m", "slope_pct", "aspect_sin", "aspect_cos",
       "rotation_years"]
)


def months(year: int, first: int, count: int) -> pd.PeriodIndex:
    return pd.period_range(pd.Period(year=year, month=first, freq="M"), periods=count, freq="M")


def window(series: pd.Series, period: pd.PeriodIndex, how: str, min_count: int) -> float:
    values = series.reindex(period)
    if values.count() < min_count:
        return np.nan
    return float(values.sum() if how == "sum" else values.mean())


def zone_climate(zone_rows: pd.DataFrame, seasons: list[int]) -> pd.DataFrame:
    """Lluvia, temperatura y humedad de cada campana al 1 de octubre, como anomalias de la zona."""
    clim = zone_rows.drop_duplicates("date").set_index("date")
    raw = pd.DataFrame({
        "precip_anom_3m": [window(clim["precip_mm"], months(y, 7, 3), "sum", 3) for y in seasons],
        "precip_anom_12m": [window(clim["precip_mm"], months(y - 1, 10, 12), "sum", 12) for y in seasons],
        "temp_anom_3m": [window(clim["temp_c"], months(y, 7, 3), "mean", 3) for y in seasons],
        "soil_moisture_anom": [window(clim["soil_moisture"], months(y, 9, 1), "mean", 1) for y in seasons],
    }, index=seasons)
    return raw.apply(zscore)


def detrended_zscore(values: pd.Series) -> pd.Series:
    """Quita la tendencia lineal entre anios y expresa el residuo en desviaciones estandar."""
    years = values.index.year.to_numpy(dtype=float)
    ok = values.notna().to_numpy()
    if ok.sum() < MIN_YEARS_FOR_TREND:
        return values * np.nan
    slope, intercept = np.polyfit(years[ok], values.to_numpy()[ok], 1)
    return zscore(values - (slope * years + intercept))


def ndvi_anomaly(sector_rows: pd.DataFrame) -> pd.Series:
    """Anomalia mensual del NDVI del sector respecto al mismo mes de todos los anios, sin tendencia.

    El NDVI del altiplano sube poco a poco desde 2000. Sin quitar esa subida, los anios recientes
    parecen mejores solo por ser recientes.
    """
    ndvi = sector_rows.set_index("date")["ndvi"]
    return ndvi.groupby(ndvi.index.month).transform(detrended_zscore)


def main() -> None:
    monthly = pd.read_csv(INTERIM / "monthly.csv")
    monthly["date"] = pd.PeriodIndex(monthly["date"], freq="M")
    sectors = json.loads((INTERIM / "sectors.geojson").read_text(encoding="utf-8"))["features"]
    seasons = list(range(FIRST_SEASON, PREDICTION_SEASON + 1))
    roni = monthly.drop_duplicates("date").set_index("date")["roni"]

    rows = []
    for zone_id, zone_rows in monthly.groupby("zone_id", sort=False):
        climate = zone_climate(zone_rows, seasons)
        offsets = rotation_offsets(zone_id)
        terrain = {f["properties"]["sector_id"]: f["properties"] for f in sectors
                   if f["properties"]["zone_id"] == zone_id}
        for sector_id, sector_rows in zone_rows.groupby("sector_id", sort=False):
            anom = ndvi_anomaly(sector_rows)
            props = terrain[sector_id]
            aspect = props["aspect_deg"]
            for y in seasons:
                predicting = y == PREDICTION_SEASON
                lag0 = pd.Period(year=y, month=RONI_LAG0_MONTH, freq="M")
                rows.append({
                    "zone_id": zone_id,
                    "sector_id": sector_id,
                    "season": season_label(y),
                    "target_ndvi_anom": np.nan if predicting else window(anom, months(y + 1, 2, 3), "mean", 2),
                    "is_prediction_row": predicting,
                    **{f"roni_lag_{k}": roni.get(lag0 - k, np.nan) for k in range(RONI_LAGS)},
                    **climate.loc[y].to_dict(),
                    "ndvi_anom_prev_peak": window(anom, months(y, 2, 3), "mean", 2),
                    "ndvi_anom_sep": window(anom, months(y, 9, 1), "mean", 1),
                    "elevation_m": props["elevation_m"],
                    "slope_pct": props["slope_pct"],
                    "aspect_sin": None if aspect is None else math.sin(math.radians(aspect)),
                    "aspect_cos": None if aspect is None else math.cos(math.radians(aspect)),
                    "rotation_years": rotation_state(offsets[sector_id], y)[1],
                })
    table = pd.DataFrame(rows)[COLUMNS].round(3)
    out = INTERIM / "features.csv"
    table.to_csv(out, index=False, encoding="utf-8")
    labelled = table["target_ndvi_anom"].notna().sum()
    print(f"{len(table)} filas ({table['zone_id'].nunique()} zonas, {len(seasons)} campanas), "
          f"{labelled} con objetivo, en {out}")


if __name__ == "__main__":
    main()
