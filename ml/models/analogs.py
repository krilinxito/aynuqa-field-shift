"""
analogs.py — Tierra gemela por distancia euclidiana en espacio físico estandarizado.
Vector: elevation_m, slope_pct, aspect_sin, aspect_cos, soil_moisture media, ndvi medio.
Para cada sector de Pumani encuentra el sector más parecido de otra zona y reporta
su anomalía de NDVI observada en El Niño 2015-16 (feb-abr 2016) y 2023-24 (feb-abr 2024),
tomada de target_ndvi_anom de features.csv (sin tendencia, igual que el objetivo del modelo).
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

    # Media histórica de humedad de suelo y NDVI de febrero a abril (pico de verdor) por sector.
    # Solo febrero a abril: las zonas análogas pueden tener NDVI solo de esos meses y de septiembre
    # (descarga rápida, ingest/appeears2.py), y la media de todo el año no sería comparable.
    peak = mdf[mdf["date"].str[5:7].isin(["02", "03", "04"])]
    agg = mdf.groupby(["zone_id", "sector_id"], as_index=False).agg(soil_moisture=("soil_moisture", "mean"))
    agg = agg.merge(
        peak.groupby(["zone_id", "sector_id"], as_index=False).agg(ndvi_mean=("ndvi", "mean")),
        on=["zone_id", "sector_id"], how="left",
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

    # Anomalía observada del gemelo: el mismo objetivo del modelo (NDVI de febrero a abril, sin tendencia)
    feats = pd.read_csv(os.path.join(input_dir, "features.csv"))
    observed = {
        (r.zone_id, r.sector_id, r.season): r.target_ndvi_anom
        for r in feats.itertuples()
        if pd.notna(r.target_ndvi_anom)
    }

    def _event_ndvi_anom(zone_id: str, sector_id: str, season: str):
        value = observed.get((zone_id, sector_id, season))
        return None if value is None else float(value)

    EVENTS_DEF = ["2015-16", "2023-24"]
    n_dims = X.shape[1]

    precedents = []
    if len(other_df) > 0:
        for pi, prow in pumani_df.iterrows():
            # Distancia euclidiana en el espacio estandarizado; similitud = 1 / (1 + distancia media por
            # dimensión). A diferencia del coseno, dos sectores solo se parecen si sus valores están cerca.
            dists = np.linalg.norm(X_other - X_pumani[pi], axis=1) / np.sqrt(n_dims)
            best_oi = int(np.argmin(dists))
            best_sim = float(1.0 / (1.0 + dists[best_oi]))
            twin = other_df.iloc[best_oi]
            twin_zone_id = twin["zone_id"]
            twin_zone_name = zone_names.get(twin_zone_id, twin_zone_id.replace("_", " ").title())
            twin_meta = sector_meta[(twin_zone_id, twin["sector_id"])]

            for event_key in EVENTS_DEF:
                ndvi_anom = _event_ndvi_anom(twin_zone_id, twin["sector_id"], event_key)
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
