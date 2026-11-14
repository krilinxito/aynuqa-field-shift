"""
fake_data.py — Genera tablas de prueba en ml/data/fake/
Zonas: pumani (target, 8 sectores display=true), jesus_de_machaca (8), caquiaviri (8)
"""
import argparse
import json
import math
import os
import random

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)

ZONES = {
    "pumani": {"lat": -17.09, "lon": -68.00, "elevation_m": 3928, "display": True},
    "jesus_de_machaca": {"lat": -16.74, "lon": -68.81, "elevation_m": 3871, "display": False},
    "caquiaviri": {"lat": -17.02, "lon": -68.61, "elevation_m": 3932, "display": False},
}

N_SECTORS = 8


def _roni_series(dates):
    """RONI sintético con picos El Niño ~2015-16 y ~2023-24."""
    roni = []
    for d in dates:
        yr = d.year + d.month / 12
        # El Niño 2015-16
        nino1516 = 1.8 * math.exp(-0.5 * ((yr - 2015.75) / 0.4) ** 2)
        # El Niño 2023-24
        nino2324 = 2.0 * math.exp(-0.5 * ((yr - 2023.75) / 0.4) ** 2)
        # La Niña 2010-11, 2020-22
        nina2011 = -1.2 * math.exp(-0.5 * ((yr - 2010.75) / 0.4) ** 2)
        nina2021 = -1.0 * math.exp(-0.5 * ((yr - 2021.0) / 0.6) ** 2)
        # ruido leve
        noise = rng.normal(0, 0.15)
        val = nino1516 + nino2324 + nina2011 + nina2021 + noise
        roni.append(round(float(val), 3))
    return roni


def _make_polygon(lat, lon, size_deg=0.01):
    """Polígono simple 4 vértices alrededor de lat/lon."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [lon - size_deg, lat - size_deg],
            [lon + size_deg, lat - size_deg],
            [lon + size_deg, lat + size_deg],
            [lon - size_deg, lat + size_deg],
            [lon - size_deg, lat - size_deg],
        ]]
    }


def _sector_id(i):
    return f"S{i+1}"


def generate_sectors_geojson(output_dir):
    features = []
    sector_props = {}
    for zone_id, zinfo in ZONES.items():
        lat0, lon0 = zinfo["lat"], zinfo["lon"]
        for i in range(N_SECTORS):
            sid = _sector_id(i)
            # offset pequeño por sector
            dlat = (i // 4) * 0.015 + rng.uniform(-0.003, 0.003)
            dlon = (i % 4) * 0.015 + rng.uniform(-0.003, 0.003)
            slat = lat0 + dlat
            slon = lon0 + dlon
            elev = zinfo["elevation_m"] + rng.integers(-50, 50)
            slope = float(rng.uniform(1, 8))
            aspect_deg = float(rng.uniform(0, 360))
            area_ha = float(rng.uniform(10, 50))
            rot_status = "resting" if i % 2 == 0 else "cultivated"
            rot_years = int(rng.integers(1, 10))
            props = {
                "zone_id": zone_id,
                "sector_id": sid,
                "display": bool(zinfo["display"]),
                "area_ha": round(area_ha, 2),
                "elevation_m": int(elev),
                "slope_pct": round(slope, 2),
                "aspect_deg": round(aspect_deg, 1),
                "rotation_status": rot_status,
                "rotation_years": rot_years,
                "is_simulated": True,
            }
            geom = _make_polygon(slat, slon, 0.008)
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

    rows = []
    for (zone_id, sid), sp in sector_props.items():
        for date in dates:
            month = date.month
            # NDVI con estacionalidad: pico en Feb-Mar (verano austral)
            ndvi_seasonal = 0.35 + 0.25 * math.sin(math.pi * (month - 2) / 6) if 2 <= month <= 8 else 0.35 + 0.1 * math.cos(math.pi * month / 6)
            roni_now = roni_map[date]
            # El Niño reduce NDVI
            nino_effect = -0.08 * max(roni_now, 0)
            ndvi = ndvi_seasonal + nino_effect + rng.normal(0, 0.04)
            ndvi = float(np.clip(ndvi, 0.05, 0.9))

            # Precip: mayor Oct-Mar, menor Jun-Sep
            precip_base = 60 + 50 * math.sin(math.pi * (month - 10) / 6) if month >= 10 or month <= 3 else 20
            precip = max(0, precip_base + rng.normal(0, 15) - 15 * max(roni_now, 0))

            temp_base = 8.0 - 0.003 * sp["elevation_m"] + 2 * math.sin(math.pi * (month - 1) / 6)
            temp = temp_base + rng.normal(0, 0.5) + 0.3 * max(roni_now, 0)

            sm = 0.3 + 0.15 * math.sin(math.pi * (month - 11) / 6) + rng.normal(0, 0.05)
            sm = float(np.clip(sm, 0.05, 0.95))

            rows.append({
                "zone_id": zone_id,
                "sector_id": sid,
                "date": date.strftime("%Y-%m"),
                "ndvi": round(ndvi, 4),
                "precip_mm": round(float(precip), 2),
                "temp_c": round(float(temp), 2),
                "soil_moisture": round(sm, 4),
                "roni": roni_map[date],
            })

    df = pd.DataFrame(rows)
    path = os.path.join(output_dir, "monthly.csv")
    df.to_csv(path, index=False)
    print(f"  → {path} ({len(df)} rows)")
    return df


def generate_features_csv(monthly_df, sector_props, output_dir):
    """Genera features.csv agregando por campaña (Jul-Jun)."""
    df = monthly_df.copy()
    df["date_dt"] = pd.to_datetime(df["date"] + "-01")
    df["year"] = df["date_dt"].dt.year
    df["month"] = df["date_dt"].dt.month
    # Campaña: Jul año Y → Jun año Y+1 → temporada "YYYY-YY"
    df["camp_year"] = df["year"].where(df["month"] >= 7, df["year"] - 1)

    rows = []
    for (zone_id, sid), sp in sector_props.items():
        sub = df[(df["zone_id"] == zone_id) & (df["sector_id"] == sid)].copy()
        sub = sub.sort_values("date_dt")

        # RONI lags por campaña
        camp_roni = {}
        for cy, grp in sub.groupby("camp_year"):
            camp_roni[cy] = grp["roni"].mean()

        camp_years = sorted(sub["camp_year"].unique())

        for ci, cy in enumerate(camp_years):
            season = f"{cy}-{str(cy+1)[-2:]}"
            grp = sub[sub["camp_year"] == cy]

            # target_ndvi_anom: media feb-abr normalizada
            feb_abr = grp[grp["month"].isin([2, 3, 4])]
            if len(feb_abr) >= 1:
                target_ndvi_anom = float(rng.normal(-0.1 * max(camp_roni.get(cy, 0), 0), 0.3))
            else:
                target_ndvi_anom = None

            # is_prediction_row
            is_pred = (cy == 2026)

            # roni_lag_0..6
            roni_lags = {}
            for lag in range(7):
                roni_lags[f"roni_lag_{lag}"] = camp_roni.get(cy - lag, 0.0)

            # anomalías climáticas
            precip_mean = grp["precip_mm"].mean()
            precip_anom_3m = float(rng.normal(0, 15))
            precip_anom_12m = float(rng.normal(0, 20))
            temp_anom_3m = float(rng.normal(0, 0.5))
            soil_anom = float(rng.normal(0, 0.05))
            ndvi_anom_prev = float(rng.normal(-0.05, 0.2))
            ndvi_anom_sep = float(rng.normal(0, 0.15))

            rows.append({
                "zone_id": zone_id,
                "sector_id": sid,
                "season": season,
                "target_ndvi_anom": round(target_ndvi_anom, 4) if target_ndvi_anom is not None else None,
                "is_prediction_row": is_pred,
                **{k: round(v, 4) for k, v in roni_lags.items()},
                "precip_anom_3m": round(precip_anom_3m, 2),
                "precip_anom_12m": round(precip_anom_12m, 2),
                "temp_anom_3m": round(temp_anom_3m, 3),
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
