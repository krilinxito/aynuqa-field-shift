"""
analogs.py — Tierra gemela por similitud coseno en espacio físico.
Para cada sector de Pumani encuentra el sector más parecido de otra zona.
"""
import argparse
import json
import os

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


def _conf_label(sim):
    if sim > 0.7:
        return "alta"
    elif sim > 0.4:
        return "media"
    return "baja"


def _conf_value(sim):
    if sim > 0.7:
        return round(sim * 0.9, 4)
    elif sim > 0.4:
        return round(sim * 0.75, 4)
    return round(sim * 0.5, 4)


def run(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    monthly_path = os.path.join(input_dir, "monthly.csv")
    sectors_path = os.path.join(input_dir, "sectors.geojson")

    mdf = pd.read_csv(monthly_path)
    with open(sectors_path, "r", encoding="utf-8") as f:
        gj = json.load(f)

    # Extraer metadata de sectores
    sector_meta = {}
    for feat in gj["features"]:
        p = feat["properties"]
        # Centroide del polígono
        coords = feat["geometry"]["coordinates"][0]
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        sector_meta[(p["zone_id"], p["sector_id"])] = {
            "elevation_m": p["elevation_m"],
            "slope_pct": p["slope_pct"],
            "aspect_sin": np.sin(np.radians(p["aspect_deg"])),
            "aspect_cos": np.cos(np.radians(p["aspect_deg"])),
            "centroid_lat": np.mean(lats),
            "centroid_lon": np.mean(lons),
        }

    # Agregar soil_moisture media y ndvi_mean por sector
    agg = mdf.groupby(["zone_id", "sector_id"]).agg(
        soil_moisture=("soil_moisture", "mean"),
        ndvi_mean=("ndvi", "mean"),
    ).reset_index()

    # Construir DataFrame de features por sector
    rows = []
    for (zone_id, sector_id), meta in sector_meta.items():
        row_agg = agg[(agg["zone_id"] == zone_id) & (agg["sector_id"] == sector_id)]
        sm = float(row_agg["soil_moisture"].values[0]) if len(row_agg) > 0 else 0.3
        ndvi_m = float(row_agg["ndvi_mean"].values[0]) if len(row_agg) > 0 else 0.4
        rows.append({
            "zone_id": zone_id,
            "sector_id": sector_id,
            "elevation_m": meta["elevation_m"],
            "slope_pct": meta["slope_pct"],
            "aspect_sin": meta["aspect_sin"],
            "aspect_cos": meta["aspect_cos"],
            "soil_moisture": sm,
            "ndvi_mean": ndvi_m,
        })

    feat_df = pd.DataFrame(rows)
    vec_cols = ["elevation_m", "slope_pct", "aspect_sin", "aspect_cos", "soil_moisture", "ndvi_mean"]

    scaler = StandardScaler()
    feat_df["_zone_sector"] = feat_df["zone_id"] + "_" + feat_df["sector_id"]
    X = scaler.fit_transform(feat_df[vec_cols].values)

    pumani_mask = feat_df["zone_id"] == "pumani"
    other_mask = feat_df["zone_id"] != "pumani"

    X_pumani = X[pumani_mask]
    X_other = X[other_mask]

    pumani_df = feat_df[pumani_mask].reset_index(drop=True)
    other_df = feat_df[other_mask].reset_index(drop=True)

    # Calcular ndvi_anomaly para eventos 2015-16 y 2023-24 en sectores analógicos
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")
    mdf["month"] = mdf["date_dt"].dt.month
    mdf["year"] = mdf["date_dt"].dt.year

    def _event_ndvi_anom(zone_id, sector_id, start_year, end_year):
        """Media feb-abr normalizada durante el evento."""
        sub = mdf[(mdf["zone_id"] == zone_id) & (mdf["sector_id"] == sector_id)]
        sub_feb_abr = sub[sub["month"].isin([2, 3, 4]) & sub["year"].isin(range(start_year, end_year + 1))]
        sub_hist = sub[sub["month"].isin([2, 3, 4]) & (sub["year"] < start_year)]
        if len(sub_feb_abr) == 0 or len(sub_hist) < 2:
            return None
        mean_event = sub_feb_abr["ndvi"].mean()
        hist_mean = sub_hist["ndvi"].mean()
        hist_std = sub_hist["ndvi"].std()
        if hist_std < 0.001:
            return None
        return float((mean_event - hist_mean) / hist_std)

    EVENTS_DEF = {
        "2015-16": (2015, 2016),
        "2023-24": (2023, 2024),
    }

    precedents = []
    for pi, prow in pumani_df.iterrows():
        # Similitud coseno con todos los sectores de otras zonas
        pv = X_pumani[pi]
        # Normalizar
        pv_norm = pv / (np.linalg.norm(pv) + 1e-9)

        sims = []
        for oi, orow in other_df.iterrows():
            ov = X_other[oi]
            ov_norm = ov / (np.linalg.norm(ov) + 1e-9)
            sim = float(np.dot(pv_norm, ov_norm))
            # Mapear a [0,1]
            sim_01 = (sim + 1) / 2
            sims.append((sim_01, oi))

        sims.sort(reverse=True)
        best_sim, best_oi = sims[0]
        twin = other_df.iloc[best_oi]

        for event_key, (ey_start, ey_end) in EVENTS_DEF.items():
            ndvi_anom = _event_ndvi_anom(twin["zone_id"], twin["sector_id"], ey_start, ey_end)
            prec = {
                "sector_id": prow["sector_id"],
                "twin_zone": twin["zone_id"],
                "twin_elevation_m": float(sector_meta[(twin["zone_id"], twin["sector_id"])]["elevation_m"]),
                "twin_slope_pct": float(sector_meta[(twin["zone_id"], twin["sector_id"])]["slope_pct"]),
                "similarity": round(float(best_sim), 4),
                "event": event_key,
                "observed_ndvi_anomaly": round(ndvi_anom, 4) if ndvi_anom is not None else None,
                "confidence": _conf_value(best_sim),
                "confidence_label": _conf_label(best_sim),
                "is_simulated": True,
            }
            precedents.append(prec)

    out = {"precedents": precedents}
    out_path = os.path.join(output_dir, "analogs_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
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
