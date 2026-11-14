"""Une NDVI, clima y RONI en una fila por sector y mes -> data/interim/monthly.csv.

Uso, desde ml/:  python prep/monthly.py   (despues de prep/sectors.py)

- ndvi: MODIS Terra y Aqua (MOD13Q1 y MYD13Q1), solo pixeles con fiabilidad 0 (buena) o 1
  (marginal). Por cada compuesto de 16 dias se promedian los pixeles del sector si al menos la
  mitad son validos; el mes es el promedio de los compuestos cuyo dia central cae en ese mes.
  Vacio si la zona aun no tiene NDVI descargado.
- precip_mm: NASA GPM IMERG V07 Final de la celda de 0,1 grados de la zona hasta su ultimo mes y,
  despues, CHIRPS ajustado con la razon IMERG/CHIRPS de los meses en que existen los dos.
- temp_c, soil_moisture: NASA POWER (T2M, GWETROOT) de la celda de la zona. Solo meses completos.
  soil_moisture es la humedad relativa de la zona de raices (0 a 1).
- roni: NOAA CPC, temporada de tres meses centrada en ese mes.
"""
import json

import numpy as np
import pandas as pd
import xarray as xr

from common import INTERIM, RAW, find_grid, load_zones, pixels_in

NDVI_PRODUCTS = ["MOD13Q1.061", "MYD13Q1.061"]
MIN_VALID_SHARE = 0.5
COLUMNS = ["zone_id", "sector_id", "date", "ndvi", "precip_mm", "temp_c", "soil_moisture", "roni"]


def climate(zone_id: str) -> pd.DataFrame:
    """Lluvia total, temperatura media y humedad de suelo media por mes completo."""
    daily = pd.read_csv(RAW / "power" / f"{zone_id}.csv", parse_dates=["date"])
    daily["month"] = daily["date"].dt.to_period("M")
    grouped = daily.groupby("month")
    days_in_month = grouped["date"].first().dt.days_in_month
    out = pd.DataFrame({
        "precip_mm": grouped["PRECTOTCORR"].sum(min_count=1),
        "temp_c": grouped["T2M"].mean(),
        "soil_moisture": grouped["GWETROOT"].mean(),
    })
    complete = grouped[["PRECTOTCORR", "T2M", "GWETROOT"]].count().ge(days_in_month, axis=0)
    complete.columns = out.columns
    out = out.where(complete)
    out["precip_mm"] = imerg_precip(zone_id).reindex(out.index)
    return out


def imerg_precip(zone_id: str) -> pd.Series:
    """Lluvia mensual de IMERG Final y, despues de su ultimo mes, de CHIRPS ajustado.

    IMERG Final llega con meses de retraso. Para los meses recientes no se usa IMERG Late: contra
    la estacion SENAMHI Ayo Ayo, Late dio la campana 2025-26 como normal y fue seca, mientras
    que CHIRPS la ordeno bien. CHIRPS se multiplica por la razon IMERG/CHIRPS de la zona en los
    meses en que existen los dos, para que quede en la escala de IMERG.
    """
    final = pd.read_csv(RAW / "imerg" / f"{zone_id}.csv")
    final = final.set_index(pd.PeriodIndex(final["date"], freq="M"))["precip_mm"]
    chirps = pd.read_csv(RAW / "chirps" / f"{zone_id}.csv")
    chirps = chirps.set_index(pd.PeriodIndex(chirps["date"], freq="M"))["precip_mm"].dropna()
    overlap = final.index.intersection(chirps.index)
    ratio = final[overlap].sum() / chirps[overlap].sum()
    recent = chirps[chirps.index > final.index.max()] * ratio
    FILL_RATIOS[zone_id] = (ratio, len(overlap), final[overlap].corr(chirps[overlap]))
    return pd.concat([final, recent])


FILL_RATIOS: dict[str, tuple[float, int, float]] = {}


def roni() -> pd.Series:
    table = pd.read_csv(RAW / "enso" / "roni.csv")
    return table.set_index(pd.PeriodIndex(table["date"], freq="M"))["value"]


def ndvi(zone: dict, sector_bounds: dict) -> pd.DataFrame:
    """NDVI mensual por sector (columnas) de los compuestos de Terra y Aqua."""
    composites = []
    for product in NDVI_PRODUCTS:
        path = find_grid(f"aynuqa_ndvi_*/{product}_250m_*.nc", zone)
        if path is None:
            continue
        with xr.open_dataset(path) as ds:
            values = ds["_250m_16_days_NDVI"].values
            reliability = ds["_250m_16_days_pixel_reliability"].values
            lat, lon = ds["lat"].values, ds["lon"].values
            starts = pd.to_datetime([t.strftime("%Y-%m-%d") for t in ds["time"].values])
        values = np.where(np.isin(reliability, [0, 1]), values, np.nan)
        centers = (starts + pd.Timedelta(days=8)).to_period("M")
        frame = {}
        for sid, bounds in sector_bounds.items():
            rows, cols = pixels_in(lat, lon, bounds)
            cube = values[:, rows][:, :, cols].reshape(len(starts), -1)
            valid = np.isfinite(cube).sum(axis=1)
            mean = np.nansum(cube, axis=1) / np.maximum(valid, 1)
            enough = (valid > 0) & (valid >= MIN_VALID_SHARE * cube.shape[1])
            frame[sid] = np.where(enough, mean, np.nan)
        composites.append(pd.DataFrame(frame, index=centers))
    if not composites:
        return pd.DataFrame()
    return pd.concat(composites).groupby(level=0).mean()


def main() -> None:
    sectors = json.loads((INTERIM / "sectors.geojson").read_text(encoding="utf-8"))["features"]
    enso = roni()
    parts = []
    for zone in load_zones():
        bounds = {}
        for f in sectors:
            if f["properties"]["zone_id"] == zone["id"]:
                ring = f["geometry"]["coordinates"][0]
                bounds[f["properties"]["sector_id"]] = (ring[0][0], ring[0][1], ring[2][0], ring[2][1])
        clim = climate(zone["id"])
        veg = ndvi(zone, bounds)
        last = max([clim.dropna(how="all").index.max()] + ([veg.index.max()] if not veg.empty else []))
        months = pd.period_range("2000-01", last, freq="M")
        for sid in bounds:
            part = pd.DataFrame(index=months)
            part["ndvi"] = veg[sid].reindex(months) if sid in veg else np.nan
            part = part.join(clim.reindex(months))
            part["roni"] = enso.reindex(months)
            part.insert(0, "date", months.strftime("%Y-%m"))
            part.insert(0, "sector_id", sid)
            part.insert(0, "zone_id", zone["id"])
            parts.append(part)
        covered = veg.reindex(months).notna().mean().mean() if not veg.empty else 0
        ratio, n, r = FILL_RATIOS[zone["id"]]
        print(f"{zone['id']}: CHIRPS x{ratio:.2f} (ajuste con {n} meses, correlacion {r:.2f} con IMERG Final)")
        print(f"{zone['id']}: {len(months)} meses, NDVI {'con dato en ' + f'{covered:.0%} de los meses' if covered else 'pendiente'}")
    table = pd.concat(parts, ignore_index=True)[COLUMNS]
    table = table.round({"ndvi": 4, "precip_mm": 1, "temp_c": 2, "soil_moisture": 3, "roni": 2})
    out = INTERIM / "monthly.csv"
    table.to_csv(out, index=False, encoding="utf-8")
    print(f"{len(table)} filas en {out}")


if __name__ == "__main__":
    main()
