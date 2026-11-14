"""
restrend.py — OLS por sector: ndvi_feb_abr ~ precip_oct_mar
Calcula residuos y rank-percentil de recuperación del suelo para Pumani.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")


def _conf_label(r2):
    if r2 > 0.5:
        return "alta"
    elif r2 > 0.2:
        return "media"
    return "baja"


def _conf_value(r2):
    if r2 > 0.5:
        return 0.8
    elif r2 > 0.2:
        return 0.55
    return 0.25


def run(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    monthly_path = os.path.join(input_dir, "monthly.csv")
    sectors_path = os.path.join(input_dir, "sectors.geojson")

    mdf = pd.read_csv(monthly_path)
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")
    mdf["month"] = mdf["date_dt"].dt.month
    mdf["year"] = mdf["date_dt"].dt.year

    # Leer estado de rotación
    import json as _json
    with open(sectors_path, "r", encoding="utf-8") as f:
        gj = _json.load(f)

    sector_meta = {}
    for feat in gj["features"]:
        p = feat["properties"]
        sector_meta[(p["zone_id"], p["sector_id"])] = {
            "rotation_status": p["rotation_status"],
            "rotation_years": p["rotation_years"],
        }

    # Calcular ndvi_feb_abr y precip_oct_mar por campaña
    # Campaña Y: oct Y-1 .. mar Y (precip), feb-abr Y (ndvi)
    results = {}

    for (zone_id, sector_id), meta in sector_meta.items():
        sub = mdf[(mdf["zone_id"] == zone_id) & (mdf["sector_id"] == sector_id)].copy()

        # Precip oct-mar por campaña (año del pico: Y = año de feb-abr)
        # Precip = oct(Y-1) + nov(Y-1) + dic(Y-1) + ene(Y) + feb(Y) + mar(Y)
        precip_rows = sub[sub["month"].isin([10, 11, 12, 1, 2, 3])].copy()
        precip_rows["camp_year"] = np.where(
            precip_rows["month"].isin([10, 11, 12]),
            precip_rows["year"] + 1,
            precip_rows["year"]
        )
        precip_by_camp = precip_rows.groupby("camp_year")["precip_mm"].sum().reset_index()
        precip_by_camp.columns = ["camp_year", "precip_oct_mar"]

        # NDVI feb-abr por campaña
        ndvi_rows = sub[sub["month"].isin([2, 3, 4])].copy()
        ndvi_rows["camp_year"] = ndvi_rows["year"]
        ndvi_by_camp = ndvi_rows.groupby("camp_year")["ndvi"].mean().reset_index()
        ndvi_by_camp.columns = ["camp_year", "ndvi_feb_abr"]

        merged = pd.merge(precip_by_camp, ndvi_by_camp, on="camp_year")
        merged = merged.dropna()

        if len(merged) < 5:
            r2 = 0.0
            residuals = pd.Series(dtype=float)
        else:
            slope, intercept, r, p_val, se = stats.linregress(merged["precip_oct_mar"], merged["ndvi_feb_abr"])
            r2 = r ** 2
            merged["fitted"] = slope * merged["precip_oct_mar"] + intercept
            merged["residual"] = merged["ndvi_feb_abr"] - merged["fitted"]
            residuals = merged.set_index("camp_year")["residual"]

        results[(zone_id, sector_id)] = {
            "r2": float(r2),
            "residuals": residuals,
            "meta": meta,
        }

    # Calcular ndvi_residual por sector
    # Para sectores en descanso: media últimas 3 campañas en ese estado
    # Para cultivados: últimas 3 campañas
    sector_scores = {}
    for (zone_id, sector_id), res in results.items():
        residuals = res["residuals"]
        if len(residuals) == 0:
            ndvi_residual = 0.0
        else:
            last_residuals = residuals.sort_index().tail(3)
            ndvi_residual = float(last_residuals.mean())

        sector_scores[(zone_id, sector_id)] = {
            "ndvi_residual": ndvi_residual,
            "r2": res["r2"],
            "meta": res["meta"],
        }

    # Rank percentil entre sectores de pumani
    pumani_scores = {
        (z, s): v for (z, s), v in sector_scores.items() if z == "pumani"
    }

    ndvi_vals = np.array([v["ndvi_residual"] for v in pumani_scores.values()])
    keys = list(pumani_scores.keys())

    if len(ndvi_vals) > 0:
        ranks = stats.rankdata(ndvi_vals) - 1
        max_rank = max(len(ndvi_vals) - 1, 1)
        percentiles = ranks / max_rank
    else:
        percentiles = np.zeros(len(keys))

    output = {}
    for idx, (zone_id, sector_id) in enumerate(keys):
        v = pumani_scores[(zone_id, sector_id)]
        score = float(percentiles[idx])
        r2 = v["r2"]
        output[sector_id] = {
            "zone_id": zone_id,
            "sector_id": sector_id,
            "score": round(score, 4),
            "level": "low" if score < 0.33 else ("medium" if score < 0.66 else "high"),
            "confidence": round(_conf_value(r2), 4),
            "confidence_label": _conf_label(r2),
            "ndvi_residual": round(v["ndvi_residual"], 4),
            "r2": round(r2, 4),
        }

    # También incluir otras zonas (con score = percentil dentro de pumani, usando comparación directa)
    for (zone_id, sector_id), v in sector_scores.items():
        if zone_id == "pumani":
            continue
        ndvi_res = v["ndvi_residual"]
        # Percentil relativo a pumani
        if len(ndvi_vals) > 0:
            score = float(np.mean(ndvi_vals < ndvi_res))
        else:
            score = 0.5
        r2 = v["r2"]
        key = f"{zone_id}_{sector_id}"
        output[key] = {
            "zone_id": zone_id,
            "sector_id": sector_id,
            "score": round(score, 4),
            "level": "low" if score < 0.33 else ("medium" if score < 0.66 else "high"),
            "confidence": round(_conf_value(r2), 4),
            "confidence_label": _conf_label(r2),
            "ndvi_residual": round(ndvi_res, 4),
            "r2": round(r2, 4),
        }

    out_path = os.path.join(output_dir, "restrend_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"  → {out_path}")
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="ml/data/fake")
    parser.add_argument("--output-dir", default="ml/outputs_fake")
    args = parser.parse_args()
    run(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
