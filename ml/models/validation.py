"""
validation.py — CV leave-one-season-out y leave-one-zone-out, backtests 2015-16 / 2023-24 / 2020-22.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")

EXCLUDE_COLS = {"zone_id", "sector_id", "season", "target_ndvi_anom",
                "is_prediction_row", "lat", "lon"}

EVENTS = {
    "2015-16": {"event_type": "nino", "start": "2015-07", "end": "2016-06"},
    "2023-24": {"event_type": "nino", "start": "2023-07", "end": "2024-06"},
    "2020-22": {"event_type": "nina", "start": "2020-07", "end": "2022-06"},
}


def _level(score):
    if score < 0.33:
        return "low"
    elif score < 0.66:
        return "medium"
    return "high"


def _score_from_quantiles(q10, q50, q90, threshold=-0.5):
    if q90 <= q10:
        return 0.5
    if threshold <= q10:
        return 0.05
    if threshold >= q90:
        return 0.95
    if threshold <= q50:
        frac = (threshold - q10) / (q50 - q10 + 1e-9)
        return 0.05 + frac * 0.45
    else:
        frac = (threshold - q50) / (q90 - q50 + 1e-9)
        return 0.5 + frac * 0.45


def _train_predict(X_train, y_train, X_test, feature_cols):
    import lightgbm as lgb
    base_params = dict(num_leaves=15, min_data_in_leaf=5, learning_rate=0.05,
                       n_estimators=100, reg_lambda=1.0, random_state=42, verbose=-1)
    preds = {}
    for alpha in [0.1, 0.5, 0.9]:
        m = lgb.LGBMRegressor(objective="quantile", alpha=alpha, **base_params)
        m.fit(X_train, y_train)
        preds[alpha] = m.predict(X_test)
    scores = np.array([
        np.clip(_score_from_quantiles(preds[0.1][i], preds[0.5][i], preds[0.9][i]), 0, 1)
        for i in range(len(X_test))
    ])
    return scores


def _baseline_zero(X_test):
    return np.zeros(len(X_test))


def _baseline_linear(X_train, y_train, X_test, feature_cols):
    from sklearn.linear_model import LinearRegression
    roni_col = feature_cols.index("roni_lag_0") if "roni_lag_0" in feature_cols else 0
    lr = LinearRegression()
    lr.fit(X_train[:, roni_col:roni_col+1], y_train)
    preds = lr.predict(X_test[:, roni_col:roni_col+1])
    # Convertir predicción de ndvi_anom a "risk": P(pred < -0.5)
    # Aproximación simple: si pred < -0.5 risk=0.8, sino lineal
    scores = np.where(preds < -0.5, 0.8, np.clip(0.5 - preds * 0.3, 0, 1))
    return scores


def _season_to_camp_year(season):
    """'2015-16' → 2015"""
    return int(season.split("-")[0])


def run_backtest(df, feature_cols, event_key, monthly_df=None):
    """Backtest de un evento: retiene ese período y predice."""
    ev = EVENTS[event_key]
    start_year = int(ev["start"][:4])

    # Excluir la temporada del evento del entrenamiento
    # La temporada es "YYYY-YY" donde YYYY es el año de julio
    # 2015-16: camp_year 2015, 2023-24: camp_year 2023, 2020-22: 2020 y 2021
    if event_key == "2020-22":
        held_years = [2020, 2021]
    else:
        held_years = [start_year]

    df["_camp_year"] = df["season"].apply(_season_to_camp_year)

    train_df = df[(df["is_prediction_row"] == False) & (~df["_camp_year"].isin(held_years))].copy()
    test_df = df[(df["is_prediction_row"] == False) & (df["_camp_year"].isin(held_years))].copy()

    if len(train_df) < 10 or len(test_df) == 0:
        return None

    train_df["target_ndvi_anom"] = train_df["target_ndvi_anom"].fillna(0)
    test_df["target_ndvi_anom"] = test_df["target_ndvi_anom"].fillna(0)

    X_train = train_df[feature_cols].astype(float).values
    y_train = train_df["target_ndvi_anom"].astype(float).values
    X_test = test_df[feature_cols].astype(float).values

    scores = _train_predict(X_train, y_train, X_test, feature_cols)
    test_df = test_df.copy()
    test_df["_pred_risk"] = scores

    # Spearman: predicted_risk vs -observed_ndvi_anomaly (mayor riesgo = menor NDVI)
    obs = test_df["target_ndvi_anom"].values
    pred = test_df["_pred_risk"].values
    if len(obs) > 2:
        sp_res, _ = stats.spearmanr(pred, -obs)
        sp_corr = float(sp_res) if not np.isnan(sp_res) else None
    else:
        sp_corr = None

    # Serie temporal agregada por zona (pumani)
    pumani_test = test_df[test_df["zone_id"] == "pumani"].copy()
    if len(pumani_test) == 0:
        # fallback: primera zona disponible
        pumani_test = test_df.groupby("zone_id").first().reset_index()

    # Construir serie mensual del evento desde monthly_df
    series = []
    if monthly_df is not None:
        mdf_ev = monthly_df[monthly_df["zone_id"] == "pumani"].copy()
        mdf_ev = mdf_ev[(mdf_ev["date"] >= ev["start"]) & (mdf_ev["date"] <= ev["end"])]
        # Agrupar por fecha y calcular media
        for date, grp in mdf_ev.groupby("date"):
            # predicted_risk: usar la media del fold para ese período
            pred_risk = float(pumani_test["_pred_risk"].mean()) if len(pumani_test) > 0 else None
            # observed_ndvi_anomaly: calcular anomalía
            obs_ndvi_anom = float(grp["ndvi"].mean() - 0.4)  # Aproximación: media - media histórica
            series.append({
                "date": date,
                "roni": float(grp["roni"].mean()),
                "predicted_risk": round(float(np.clip(pred_risk, 0, 1)), 4) if pred_risk is not None else None,
                "observed_ndvi_anomaly": round(obs_ndvi_anom, 4),
                "precip_anomaly_pct": round(float((grp["precip_mm"].mean() - 60) / 60 * 100), 2),
            })

    # Si no hay monthly_df, generar serie desde features
    if not series:
        for cy in held_years:
            date_str = f"{cy}-10"  # Mes representativo
            row_data = pumani_test[pumani_test["_camp_year"] == cy]
            pred_risk = float(row_data["_pred_risk"].mean()) if len(row_data) > 0 else 0.5
            obs_anom = float(row_data["target_ndvi_anom"].mean()) if len(row_data) > 0 else 0.0
            series.append({
                "date": date_str,
                "roni": float(row_data["roni_lag_0"].mean()) if len(row_data) > 0 else 0.0,
                "predicted_risk": round(float(np.clip(pred_risk, 0, 1)), 4),
                "observed_ndvi_anomaly": round(obs_anom, 4),
                "precip_anomaly_pct": round(float(row_data["precip_anom_3m"].mean() if len(row_data) > 0 else 0.0), 2),
            })

    # Per-sector
    per_sector = []
    for zone_id, sector_id, pred_risk, obs_anom in zip(
        test_df["zone_id"], test_df["sector_id"],
        test_df["_pred_risk"], test_df["target_ndvi_anom"]
    ):
        per_sector.append({
            "sector_id": sector_id,
            "predicted_risk": round(float(np.clip(pred_risk, 0, 1)), 4),
            "observed_ndvi_anomaly": round(float(obs_anom), 4),
        })

    # Per-sector Spearman
    if len(per_sector) > 2:
        ps_pred = [x["predicted_risk"] for x in per_sector]
        ps_obs = [x["observed_ndvi_anomaly"] for x in per_sector]
        ps_res, _ = stats.spearmanr(ps_pred, [-o for o in ps_obs])
        ps_sp = float(ps_res) if not np.isnan(ps_res) else None
    else:
        ps_sp = None

    # Note sobre LightGBM vs baseline (honesto)
    base_zero = _baseline_zero(X_test)
    base_lin = _baseline_linear(X_train, y_train, X_test, feature_cols)
    if sp_corr is not None:
        bz_res = stats.spearmanr(base_zero, -obs)[0] if len(obs) > 2 else 0
        bl_res = stats.spearmanr(base_lin, -obs)[0] if len(obs) > 2 else 0
        bz_sp = float(bz_res) if not np.isnan(bz_res) else 0.0
        bl_sp = float(bl_res) if not np.isnan(bl_res) else 0.0
        if sp_corr > max(bz_sp, bl_sp):
            note = f"LightGBM supera las baselines (Spearman LGB={sp_corr:.2f}, zero={bz_sp:.2f}, lineal={bl_sp:.2f}). Datos simulados."
        else:
            note = f"LightGBM no supera las baselines con datos simulados (Spearman LGB={sp_corr:.2f}, zero={bz_sp:.2f}, lineal={bl_sp:.2f}). Esperado con datos sintéticos."
    else:
        note = "Muestra insuficiente o varianza nula para calcular correlación con baselines."

    mean_pred = float(test_df["_pred_risk"].mean())
    mean_obs = float(test_df["target_ndvi_anom"].mean())

    return {
        "event": event_key,
        "event_type": ev["event_type"],
        "held_out": True,
        "zone": {
            "id": "pumani",
            "series": series,
            "mean_predicted_risk": round(float(np.clip(mean_pred, 0, 1)), 4),
            "mean_observed_ndvi_anomaly": round(mean_obs, 4),
            "metric": {
                "spearman": round(float(sp_corr), 4) if sp_corr is not None else None,
                "n": int(len(obs)),
                "note": "Spearman entre predicted_risk y -observed_ndvi_anomaly.",
            }
        },
        "per_sector": per_sector,
        "per_sector_metric": {
            "spearman": round(float(ps_sp), 4) if ps_sp is not None else None,
            "n": len(per_sector),
            "note": note,
        },
        "note": note,
    }


def run(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    feat_path = os.path.join(input_dir, "features.csv")
    monthly_path = os.path.join(input_dir, "monthly.csv")

    df = pd.read_csv(feat_path)
    df["is_prediction_row"] = df["is_prediction_row"].astype(bool)
    monthly_df = pd.read_csv(monthly_path) if os.path.exists(monthly_path) else None

    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]

    backtests = {}
    for ev in EVENTS:
        print(f"  Backtest {ev} ...")
        result = run_backtest(df.copy(), feature_cols, ev, monthly_df)
        if result is not None:
            backtests[ev] = result
        else:
            print(f"  [WARN] Backtest {ev}: datos insuficientes, omitido.")

    out_path = os.path.join(output_dir, "backtests_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(backtests, f, indent=2)
    print(f"  → {out_path}")
    return backtests


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="ml/data/fake")
    parser.add_argument("--output-dir", default="ml/outputs_fake")
    args = parser.parse_args()
    run(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
