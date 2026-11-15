"""
fake_data.py — Genera tablas de prueba en ml/data/fake/ con el formato exacto de ml/TABLAS.md.
Zonas: pumani (target, 13 sectores display=true), jesus_de_machaca (13), caquiaviri (13).
"""
import argparse
import json
import math
import os

import numpy as np
import pandas as pd

from ml.prep.common import ndvi_anomaly

SEED = 42
rng = np.random.default_rng(SEED)

ZONES = {
    "pumani": {"lat": -17.09, "lon": -68.00, "elevation_m": 3928, "display": True},
    "jesus_de_machaca": {"lat": -16.74, "lon": -68.81, "elevation_m": 3871, "display": False},
    "caquiaviri": {"lat": -17.02, "lon": -68.61, "elevation_m": 3932, "display": False},
}

N_SECTORS = 13


def _roni_series(dates):
    """RONI sintético con picos El Niño ~2015-16, ~2023-24 y ~2026, y La Niña ~2010-11, ~2020-22."""
    roni = []
    for d in dates:
        yr = d.year + (d.month - 0.5) / 12.0
        nino1516 = 2.1 * math.exp(-0.5 * ((yr - 2015.85) / 0.35) ** 2)
        nino2324 = 2.0 * math.exp(-0.5 * ((yr - 2023.85) / 0.35) ** 2)
        nino2627 = 1.95 * math.exp(-0.5 * ((yr - 2026.75) / 0.45) ** 2)
        nina2011 = -1.3 * math.exp(-0.5 * ((yr - 2010.8) / 0.4) ** 2)
        nina2021 = -1.1 * math.exp(-0.5 * ((yr - 2021.3) / 0.7) ** 2)
        noise = rng.normal(0, 0.12)
        val = nino1516 + nino2324 + nino2627 + nina2011 + nina2021 + noise
        roni.append(round(float(val), 3))
    return roni


def _make_polygon(lat, lon, size_deg=0.008):
    """Polígono simple 4 vértices alrededor de lat/lon."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [round(lon - size_deg, 6), round(lat - size_deg, 6)],
            [round(lon + size_deg, 6), round(lat - size_deg, 6)],
            [round(lon + size_deg, 6), round(lat + size_deg, 6)],
            [round(lon - size_deg, 6), round(lat + size_deg, 6)],
            [round(lon - size_deg, 6), round(lat - size_deg, 6)],
        ]],
    }


def generate_sectors_geojson(output_dir):
    features = []
    sector_props = {}
    for zone_id, zinfo in ZONES.items():
        lat0, lon0 = zinfo["lat"], zinfo["lon"]
        for i in range(N_SECTORS):
            sid = f"S{i + 1}"
            dlat = (i // 4) * 0.012 + float(rng.uniform(-0.002, 0.002))
            dlon = (i % 4) * 0.012 + float(rng.uniform(-0.002, 0.002))
            slat = lat0 + dlat
            slon = lon0 + dlon
            elev = int(zinfo["elevation_m"] + rng.integers(-45, 45))
            slope = float(rng.uniform(1.5, 8.5))
            aspect_deg = float(rng.uniform(0, 360))
            area_ha = float(rng.uniform(18, 45))
            # Ciclo aynuqa de 13 años (IBTA-ORSTOM): 10 sectores en descanso (1 a 10 años), 3 cultivados (1 a 3 años)
            if i < 10:
                rot_status = "resting"
                rot_years = 10 - i
            else:
                rot_status = "cultivated"
                rot_years = i - 9

            props = {
                "zone_id": zone_id,
                "sector_id": sid,
                "display": bool(zinfo["display"]),
                "area_ha": round(area_ha, 2),
                "elevation_m": elev,
                "slope_pct": round(slope, 2),
                "aspect_deg": round(aspect_deg, 1),
                "rotation_status": rot_status,
                "rotation_years": rot_years,
                "is_simulated": True,
            }
            geom = _make_polygon(slat, slon, 0.004)
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": props,
            })
            sector_props[(zone_id, sid)] = {
                **props,
                "lat": slat,
                "lon": slon,
            }

    geojson = {"type": "FeatureCollection", "features": features}
    path = os.path.join(output_dir, "sectors.geojson")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)
    print(f"  → {path} ({len(features)} features)")
    return sector_props


def generate_monthly_csv(sector_props, output_dir):
    dates = pd.date_range("2000-01-01", "2026-10-01", freq="MS")
    roni_vals = _roni_series(dates)
    roni_map = {d: r for d, r in zip(dates, roni_vals)}

    # Clima a nivel de ZONA (idéntico para todos los sectores de la misma zona)
    zone_climate = {}
    for zone_id, zinfo in ZONES.items():
        elev_z = zinfo["elevation_m"]
        zone_offset = rng.normal(0, 0.2)
        for date in dates:
            month = date.month
            roni_now = roni_map[date]

            # Lluvia mayor Oct-Mar, mínima Jun-Ago
            precip_cycle = 55.0 + 48.0 * math.sin(2 * math.pi * (month - 10) / 12.0)
            precip = max(0.5, precip_cycle - 14.0 * max(roni_now, 0) + 8.0 * max(-roni_now, 0) + rng.normal(0, 12.0))

            temp_cycle = 8.5 - 0.001 * (elev_z - 3900) + 2.5 * math.sin(2 * math.pi * (month - 10) / 12.0)
            temp = temp_cycle + 0.45 * roni_now + zone_offset + rng.normal(0, 0.45)

            sm_cycle = 0.42 + 0.14 * math.sin(2 * math.pi * (month - 11) / 12.0)
            sm = float(np.clip(sm_cycle - 0.04 * max(roni_now, 0) + rng.normal(0, 0.03), 0.10, 0.90))

            zone_climate[(zone_id, date)] = {
                "precip_mm": round(float(precip), 2),
                "temp_c": round(float(temp), 2),
                "soil_moisture": round(sm, 4),
                "roni": roni_map[date],
            }

    rows = []
    for (zone_id, sid), sp in sector_props.items():
        # Efecto sectorial por terreno y estado de rotación
        elev_eff = -0.00015 * (sp["elevation_m"] - 3900)
        rot_eff = 0.025 * (sp["rotation_years"] / 10.0) if sp["rotation_status"] == "resting" else -0.015
        sector_bias = elev_eff + rot_eff

        for date in dates:
            month = date.month
            zc = zone_climate[(zone_id, date)]
            roni_now = zc["roni"]

            # NDVI con pico en Feb-Mar (verano austral), sensible a lluvia, humedad y RONI
            ndvi_cycle = 0.24 + 0.13 * math.sin(2 * math.pi * (month - 11.5) / 12.0)
            rain_boost = 0.0007 * (zc["precip_mm"] - 45.0)
            nino_effect = -0.045 * max(roni_now, 0) + 0.015 * max(-roni_now, 0)
            ndvi = ndvi_cycle + rain_boost + nino_effect + sector_bias + rng.normal(0, 0.022)
            ndvi = float(np.clip(ndvi, 0.05, 0.85))

            rows.append({
                "zone_id": zone_id,
                "sector_id": sid,
                "date": date.strftime("%Y-%m"),
                "ndvi": round(ndvi, 4),
                "precip_mm": zc["precip_mm"],
                "temp_c": zc["temp_c"],
                "soil_moisture": zc["soil_moisture"],
                "roni": zc["roni"],
            })

    df = pd.DataFrame(rows)
    # Misma anomalia sin tendencia que produce prep/monthly.py (ver ml/TABLAS.md)
    anoms = []
    for _, g in df.groupby(["zone_id", "sector_id"], sort=False):
        ndvi = pd.Series(g["ndvi"].to_numpy(), index=pd.PeriodIndex(g["date"], freq="M"))
        anoms.append(pd.Series(ndvi_anomaly(ndvi).to_numpy(), index=g.index))
    df.insert(df.columns.get_loc("ndvi") + 1, "ndvi_anom", pd.concat(anoms).round(3))
    path = os.path.join(output_dir, "monthly.csv")
    df.to_csv(path, index=False)
    print(f"  → {path} ({len(df)} rows)")
    return df


def _zscore(val, series):
    s = series.dropna()
    if len(s) < 2 or s.std() < 1e-6 or pd.isna(val):
        return 0.0
    return float((val - s.mean()) / s.std())


def generate_features_csv(monthly_df, sector_props, output_dir):
    """Genera features.csv agregando por campaña (Jul-Jun) desde 2000-01."""
    df = monthly_df.copy()
    df["date_dt"] = pd.to_datetime(df["date"] + "-01")
    df["year"] = df["date_dt"].dt.year
    df["month"] = df["date_dt"].dt.month
    # Campaña agrícola: julio año Y a junio año Y+1 -> "YYYY-YY"
    df["camp_year"] = df["year"].where(df["month"] >= 7, df["year"] - 1)

    # Climatologías por zona para variables climáticas
    zone_monthly = df.drop_duplicates(subset=["zone_id", "date"]).copy()

    rows = []
    for (zone_id, sid), sp in sector_props.items():
        sub = df[(df["zone_id"] == zone_id) & (df["sector_id"] == sid)].sort_values("date_dt").copy()
        zsub = zone_monthly[zone_monthly["zone_id"] == zone_id].sort_values("date_dt").copy()

        # Series por campaña para calcular anomalías históricas reales
        feb_abr_by_cy = (
            sub[sub["month"].isin([2, 3, 4])]
            .groupby("camp_year")["ndvi"]
            .mean()
        )
        sep_ndvi_by_cy = sub[sub["month"] == 9].set_index("camp_year")["ndvi"]
        p3m_by_cy = zsub[zsub["month"].isin([7, 8, 9])].groupby("camp_year")["precip_mm"].sum()
        t3m_by_cy = zsub[zsub["month"].isin([7, 8, 9])].groupby("camp_year")["temp_c"].mean()
        sm_sep_by_cy = zsub[zsub["month"] == 9].set_index("camp_year")["soil_moisture"]

        # Precip oct-sep (los 12 meses previos al 1 de octubre del año cy)
        p12m_by_cy = {}
        for cy in range(2000, 2027):
            mask_12m = (
                ((zsub["year"] == cy - 1) & (zsub["month"] >= 10))
                | ((zsub["year"] == cy) & (zsub["month"] <= 9))
            )
            if mask_12m.sum() >= 6:
                p12m_by_cy[cy] = float(zsub.loc[mask_12m, "precip_mm"].sum())
        p12m_s = pd.Series(p12m_by_cy)

        # RONI mensual indexado por fecha
        roni_by_dt = zsub.set_index("date_dt")["roni"]

        camp_years = sorted([cy for cy in sub["camp_year"].unique() if cy >= 2000])

        for cy in camp_years:
            season = f"{cy}-{str(cy + 1)[-2:]}"
            is_pred = (cy == 2026)

            # Objetivo: anomalía NDVI feb-abr de la campaña (vacío en campaña en curso)
            if is_pred or cy not in feb_abr_by_cy.index:
                target_ndvi_anom = None
            else:
                target_ndvi_anom = round(_zscore(feb_abr_by_cy.loc[cy], feb_abr_by_cy), 4)

            # roni_lag_0..6: RONI de septiembre (lag_0) y los 6 meses anteriores
            sep_dt = pd.Timestamp(year=cy, month=9, day=1)
            roni_lags = {}
            for lag in range(7):
                dt_lag = sep_dt - pd.DateOffset(months=lag)
                val = roni_by_dt.get(dt_lag, 0.0)
                roni_lags[f"roni_lag_{lag}"] = round(float(0.0 if pd.isna(val) else val), 4)

            precip_anom_3m = _zscore(p3m_by_cy.get(cy, np.nan), p3m_by_cy)
            precip_anom_12m = _zscore(p12m_s.get(cy, np.nan), p12m_s)
            temp_anom_3m = _zscore(t3m_by_cy.get(cy, np.nan), t3m_by_cy)
            soil_anom = _zscore(sm_sep_by_cy.get(cy, np.nan), sm_sep_by_cy)
            ndvi_anom_prev = _zscore(feb_abr_by_cy.get(cy - 1, np.nan), feb_abr_by_cy)
            ndvi_anom_sep = _zscore(sep_ndvi_by_cy.get(cy, np.nan), sep_ndvi_by_cy)

            rows.append({
                "zone_id": zone_id,
                "sector_id": sid,
                "season": season,
                "target_ndvi_anom": target_ndvi_anom,
                "is_prediction_row": is_pred,
                **roni_lags,
                "precip_anom_3m": round(precip_anom_3m, 4),
                "precip_anom_12m": round(precip_anom_12m, 4),
                "temp_anom_3m": round(temp_anom_3m, 4),
                "soil_moisture_anom": round(soil_anom, 4),
                "ndvi_anom_prev_peak": round(ndvi_anom_prev, 4),
                "ndvi_anom_sep": round(ndvi_anom_sep, 4),
                "elevation_m": sp["elevation_m"],
                "slope_pct": round(sp["slope_pct"], 2),
                "aspect_sin": round(math.sin(math.radians(sp["aspect_deg"])), 4),
                "aspect_cos": round(math.cos(math.radians(sp["aspect_deg"])), 4),
                "rotation_years": sp["rotation_years"],
            })

    feat_df = pd.DataFrame(rows)
    path = os.path.join(output_dir, "features.csv")
    feat_df.to_csv(path, index=False)
    print(f"  → {path} ({len(feat_df)} rows)")
    return feat_df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="ml/data/fake")
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    print(f"Generando datos fake en {args.output_dir} ...")
    sp = generate_sectors_geojson(args.output_dir)
    mdf = generate_monthly_csv(sp, args.output_dir)
    generate_features_csv(mdf, sp, args.output_dir)
    print("Done.")


if __name__ == "__main__":
    main()
