"""
analogs.py — Tierra gemela por similitud coseno en espacio físico estandarizado.
Vector: elevation_m, slope_pct, aspect_sin, aspect_cos, soil_moisture media, ndvi medio.
Para cada sector de Pumani encuentra el sector más parecido de otra zona y reporta
su anomalía de NDVI observada en El Niño 2015-16 (feb-abr 2016) y 2023-24 (feb-abr 2024).
"""
import argparse
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

ZONES_JSON = Path(__file__).parent.parent / "zones.json"


def _load_zone_info() -> tuple[dict, dict]:
    if not ZONES_JSON.exists():
        return {}, {}
    with open(ZONES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    names = {z["id"]: z["name"] for z in data.get("zones", [])}
    elevs = {z["id"]: float(z.get("elevation_m", 3900.0)) for z in data.get("zones", [])}
    return names, elevs


def _conf_label(conf: float) -> str:
    if conf < 0.4:
        return "baja"
    elif conf <= 0.7:
        return "media"
    return "alta"


def _conf_value(sim: float, has_obs: bool) -> float:
    if not has_obs:
        return 0.25
    # Confianza proporcional a la similitud física
    return round(float(np.clip(sim * 0.85, 0.2, 0.92)), 4)


def run(input_dir: str, output_dir: str) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    is_real = "interim" in str(input_dir)
    zone_names, zone_elevs = _load_zone_info()

    monthly_path = os.path.join(input_dir, "monthly.csv")
    sectors_path = os.path.join(input_dir, "sectors.geojson")

    mdf = pd.read_csv(monthly_path)
    with open(sectors_path, "r", encoding="utf-8") as f:
        gj = json.load(f)

    sector_meta = {}
    for feat in gj["features"]:
        p = feat["properties"]
        zid = p["zone_id"]
        elev_raw = p.get("elevation_m")
        slope_raw = p.get("slope_pct")
        aspect_raw = p.get("aspect_deg")
        elev_val = float(elev_raw) if elev_raw is not None and not pd.isna(elev_raw) else zone_elevs.get(zid, 3900.0)
        slope_val = float(slope_raw) if slope_raw is not None and not pd.isna(slope_raw) else 0.0
        if aspect_raw is not None and not pd.isna(aspect_raw):
            asp_sin = float(np.sin(np.radians(float(aspect_raw))))
            asp_cos = float(np.cos(np.radians(float(aspect_raw))))
        else:
            asp_sin = 0.0
            asp_cos = 0.0
        sector_meta[(zid, p["sector_id"])] = {
            "display": bool(p.get("display", False)),
            "elevation_m": elev_val,
            "slope_pct": slope_val,
            "aspect_sin": asp_sin,
            "aspect_cos": asp_cos,
        }

    # Media histórica de humedad de suelo y NDVI por sector (ignorando nulos reales)
    agg = mdf.groupby(["zone_id", "sector_id"], as_index=False).agg(
        soil_moisture=("soil_moisture", "mean"),
        ndvi_mean=("ndvi", "mean"),
    )
    agg_map = {
        (r["zone_id"], r["sector_id"]): (r["soil_moisture"], r["ndvi_mean"])
        for _, r in agg.iterrows()
    }

    rows = []
    for (zone_id, sector_id), meta in sector_meta.items():
        sm, ndvi_m = agg_map.get((zone_id, sector_id), (np.nan, np.nan))
        rows.append({
            "zone_id": zone_id,
            "sector_id": sector_id,
            "display": meta["display"],
            "elevation_m": meta["elevation_m"],
            "slope_pct": meta["slope_pct"],
            "aspect_sin": meta["aspect_sin"],
            "aspect_cos": meta["aspect_cos"],
            "soil_moisture": sm,
            "ndvi_mean": ndvi_m,
        })

    feat_df = pd.DataFrame(rows)
    vec_cols = ["elevation_m", "slope_pct", "aspect_sin", "aspect_cos", "soil_moisture", "ndvi_mean"]
    # Imputación solo en vector estandarizado para calcular distancia si algún sector carece de promedio
    vec_vals = feat_df[vec_cols].copy()
    for col in vec_cols:
        if vec_vals[col].isna().any():
            med = vec_vals[col].median()
            vec_vals[col] = vec_vals[col].fillna(0.0 if pd.isna(med) else med)

    scaler = StandardScaler()
    X = scaler.fit_transform(vec_vals.values)

    pumani_mask = feat_df["zone_id"] == "pumani"
    other_mask = feat_df["zone_id"] != "pumani"

    X_pumani = X[pumani_mask]
    X_other = X[other_mask]
    pumani_df = feat_df[pumani_mask].reset_index(drop=True)
    other_df = feat_df[other_mask].reset_index(drop=True)

    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")
    mdf["month"] = mdf["date_dt"].dt.month
    mdf["year"] = mdf["date_dt"].dt.year

    def _event_ndvi_anom(zone_id: str, sector_id: str, peak_year: int):
        """
        Anomalía de NDVI de feb-abr del año pico de campaña (2016 para 2015-16, 2024 para 2023-24)
        expresada en desviaciones estándar respecto a todos los feb-abr desde 2000.
        """
        sub = mdf[
            (mdf["zone_id"] == zone_id)
            & (mdf["sector_id"] == sector_id)
            & (mdf["month"].isin([2, 3, 4]))
            & (mdf["ndvi"].notna())
        ]
        by_year = sub.groupby("year")["ndvi"].mean()
        if peak_year not in by_year.index or len(by_year) < 3:
            return None
        hist_std = float(by_year.std())
        if hist_std < 1e-6:
            return None
        return float((by_year.loc[peak_year] - by_year.mean()) / hist_std)

    EVENTS_DEF = {
        "2015-16": 2016,
        "2023-24": 2024,
    }

    precedents = []
    if len(other_df) > 0:
        for pi, prow in pumani_df.iterrows():
            pv = X_pumani[pi]
            pv_norm = pv / (np.linalg.norm(pv) + 1e-9)

            sims = []
            for oi in range(len(other_df)):
                ov = X_other[oi]
                ov_norm = ov / (np.linalg.norm(ov) + 1e-9)
                cos_sim = float(np.dot(pv_norm, ov_norm))
                sim_01 = float(np.clip((cos_sim + 1.0) / 2.0, 0.0, 1.0))
                sims.append((sim_01, oi))

            sims.sort(reverse=True)
            best_sim, best_oi = sims[0]
            twin = other_df.iloc[best_oi]
            twin_zone_id = twin["zone_id"]
            twin_zone_name = zone_names.get(twin_zone_id, twin_zone_id.replace("_", " ").title())
            twin_meta = sector_meta[(twin_zone_id, twin["sector_id"])]

            for event_key, peak_year in EVENTS_DEF.items():
                ndvi_anom = _event_ndvi_anom(twin_zone_id, twin["sector_id"], peak_year)
                conf = _conf_value(best_sim, ndvi_anom is not None)
                precedents.append({
                    "sector_id": prow["sector_id"],
                    "twin_zone": twin_zone_name,
                    "twin_elevation_m": round(twin_meta["elevation_m"], 1),
                    "twin_slope_pct": round(twin_meta["slope_pct"], 2),
                    "similarity": round(best_sim, 4),
                    "event": event_key,
                    "observed_ndvi_anomaly": round(ndvi_anom, 4) if ndvi_anom is not None else None,
                    "confidence": conf,
                    "confidence_label": _conf_label(conf),
                    "is_simulated": not is_real,
                })

    out = {"precedents": precedents}
    out_path = os.path.join(output_dir, "analogs_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"  → {out_path}")
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="ml/data/fake")
    parser.add_argument("--output-dir", default="ml/outputs_fake")
    args = parser.parse_args()
    run(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
