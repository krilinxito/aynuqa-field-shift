"""
restrend.py — OLS por sector: NDVI (febrero a abril) ~ lluvia acumulada (octubre a marzo).
El residuo es lo que la lluvia no explica:
- Si el sector está en descanso: residuo medio de las últimas campañas en descanso (rotation_years).
- Si está cultivado: residuo medio de las últimas 3 campañas.
- score: posición relativa (0 a 1) entre los sectores de Pumani.
NOTA: La rotación y los años de descanso son simulados; la relación con los años de descanso es ilustrativa.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")


def _conf_label(conf: float) -> str:
    if conf < 0.4:
        return "baja"
    elif conf <= 0.7:
        return "media"
    return "alta"


def _conf_value(r2: float, n_obs: int) -> float:
    if n_obs < 5:
        return 0.25
    # Mapeo monotónico desde R² del ajuste lluvia-NDVI
    if r2 > 0.5:
        return round(float(min(0.9, 0.71 + (r2 - 0.5) * 0.35)), 4)
    elif r2 > 0.2:
        return round(float(0.42 + (r2 - 0.2) / 0.3 * 0.26), 4)
    return round(float(max(0.2, 0.2 + r2 * 0.9)), 4)


def run(input_dir: str, output_dir: str) -> dict:
    os.makedirs(output_dir, exist_ok=True)

    monthly_path = os.path.join(input_dir, "monthly.csv")
    sectors_path = os.path.join(input_dir, "sectors.geojson")

    mdf = pd.read_csv(monthly_path)
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")
    mdf["month"] = mdf["date_dt"].dt.month
    mdf["year"] = mdf["date_dt"].dt.year

    with open(sectors_path, "r", encoding="utf-8") as f:
        gj = json.load(f)

    sector_meta = {}
    for feat in gj["features"]:
        p = feat["properties"]
        sector_meta[(p["zone_id"], p["sector_id"])] = {
            "display": bool(p.get("display", False)),
            "rotation_status": p["rotation_status"],
            "rotation_years": int(p["rotation_years"]),
        }

    results = {}
    for (zone_id, sector_id), meta in sector_meta.items():
        sub = mdf[(mdf["zone_id"] == zone_id) & (mdf["sector_id"] == sector_id)].copy()

        # Lluvia acumulada oct(Y-1)..mar(Y) por campaña Y
        precip_rows = sub[sub["month"].isin([10, 11, 12, 1, 2, 3])].copy()
        precip_rows["camp_year"] = np.where(
            precip_rows["month"].isin([10, 11, 12]),
            precip_rows["year"] + 1,
            precip_rows["year"],
        )
        precip_by_camp = (
            precip_rows.groupby("camp_year", as_index=False)
            .agg(precip_oct_mar=("precip_mm", "sum"), n_p=("precip_mm", "count"))
        )
        precip_by_camp = precip_by_camp[precip_by_camp["n_p"] >= 3]

        # NDVI medio feb(Y)..abr(Y) por campaña Y (ignorando nulos reales)
        ndvi_rows = sub[sub["month"].isin([2, 3, 4]) & sub["ndvi"].notna()].copy()
        ndvi_rows["camp_year"] = ndvi_rows["year"]
        ndvi_by_camp = ndvi_rows.groupby("camp_year")["ndvi"].mean().reset_index()
        ndvi_by_camp.columns = ["camp_year", "ndvi_feb_abr"]

        merged = pd.merge(precip_by_camp[["camp_year", "precip_oct_mar"]], ndvi_by_camp, on="camp_year")
        merged = merged.dropna()

        if len(merged) < 5 or merged["precip_oct_mar"].std() < 1e-6:
            r2 = 0.0
            residuals = pd.Series(dtype=float)
            n_obs = int(len(merged))
        else:
            slope, intercept, r, _, _ = stats.linregress(merged["precip_oct_mar"], merged["ndvi_feb_abr"])
            r2 = float(r ** 2)
            merged["fitted"] = slope * merged["precip_oct_mar"] + intercept
            merged["residual"] = merged["ndvi_feb_abr"] - merged["fitted"]
            residuals = merged.set_index("camp_year")["residual"].sort_index()
            n_obs = int(len(merged))

        results[(zone_id, sector_id)] = {
            "r2": r2,
            "n_obs": n_obs,
            "residuals": residuals,
            "meta": meta,
        }

    # Residuo medio por sector:
    # - Si resting: últimas rotation_years campañas (mínimo 1 si rotation_years == 0)
    # - Si cultivated: últimas 3 campañas
    sector_scores = {}
    for (zone_id, sector_id), res in results.items():
        residuals = res["residuals"]
        meta = res["meta"]
        if len(residuals) == 0:
            ndvi_residual = None
        else:
            if meta["rotation_status"] == "resting":
                k = max(1, meta["rotation_years"])
            else:
                k = 3
            ndvi_residual = float(residuals.tail(k).mean())

        sector_scores[(zone_id, sector_id)] = {
            "ndvi_residual": ndvi_residual,
            "r2": res["r2"],
            "n_obs": res["n_obs"],
            "meta": meta,
        }

    # Posición (0 a 1) entre los sectores de Pumani (con display=true si aplica, o todos los de Pumani)
    pumani_keys = [
        (z, s) for (z, s), v in sector_scores.items()
        if z == "pumani" and v["ndvi_residual"] is not None
    ]
    pumani_vals = np.array([sector_scores[k]["ndvi_residual"] for k in pumani_keys], dtype=float)

    if len(pumani_vals) > 1:
        ranks = stats.rankdata(pumani_vals, method="average") - 1.0
        percentiles = ranks / (len(pumani_vals) - 1.0)
        pumani_score_map = {k: float(percentiles[i]) for i, k in enumerate(pumani_keys)}
    elif len(pumani_vals) == 1:
        pumani_score_map = {pumani_keys[0]: 0.5}
    else:
        pumani_score_map = {}

    output = {
        "_note": "La relación entre recuperación (RESTREND) y años de descanso es ilustrativa porque la rotación es simulada.",
        "sectors": {},
    }

    for (zone_id, sector_id), v in sector_scores.items():
        ndvi_res = v["ndvi_residual"]
        if zone_id == "pumani":
            score = pumani_score_map.get((zone_id, sector_id), 0.5)
        else:
            if len(pumani_vals) > 0 and ndvi_res is not None:
                score = float(np.mean(pumani_vals <= ndvi_res))
            else:
                score = 0.5

        conf = _conf_value(v["r2"], v["n_obs"])
        entry = {
            "zone_id": zone_id,
            "sector_id": sector_id,
            "score": round(score, 4),
            "level": "low" if score < 0.33 else ("medium" if score < 0.66 else "high"),
            "confidence": conf,
            "confidence_label": _conf_label(conf),
            "ndvi_residual": round(ndvi_res, 4) if ndvi_res is not None else None,
            "r2": round(v["r2"], 4),
            "rotation_simulated": True,
        }
        if zone_id == "pumani":
            output["sectors"][sector_id] = entry
            output[sector_id] = entry
        else:
            output[f"{zone_id}_{sector_id}"] = entry

    out_path = os.path.join(output_dir, "restrend_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
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
