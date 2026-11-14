"""
validation.py — Validación cruzada (leave-one-season-out y leave-one-zone-out),
comparación contra baselines (siempre 0 y regresión lineal con roni_lag_0),
backtests sin fuga de 2015-16, 2023-24 y 2020-22, y reporte en ml/reports/.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd
from scipy import stats

from ml.models.drought_model import (
    BASE_LGB_PARAMS,
    EXCLUDE_COLS,
    _score_from_quantiles,
)

warnings.filterwarnings("ignore")

EVENTS = {
    "2015-16": {"event_type": "nino", "start": "2015-07", "end": "2016-06", "camp_years": [2015]},
    "2023-24": {"event_type": "nino", "start": "2023-07", "end": "2024-06", "camp_years": [2023]},
    "2020-22": {"event_type": "nina", "start": "2020-07", "end": "2022-06", "camp_years": [2020, 2021]},
}


def _season_to_camp_year(season: str) -> int:
    return int(str(season).split("-")[0])


def _safe_spearman(x, y):
    arr_x = np.asarray(x, dtype=float)
    arr_y = np.asarray(y, dtype=float)
    mask = (~np.isnan(arr_x)) & (~np.isnan(arr_y))
    arr_x, arr_y = arr_x[mask], arr_y[mask]
    if len(arr_x) < 3 or np.std(arr_x) < 1e-12 or np.std(arr_y) < 1e-12:
        return None
    corr, _ = stats.spearmanr(arr_x, arr_y)
    if np.isnan(corr):
        return None
    return round(float(corr), 4)


def _fit_lgb_bundle(X_train, y_train):
    import lightgbm as lgb

    bundle = {}
    for alpha in [0.1, 0.5, 0.9]:
        m = lgb.LGBMRegressor(objective="quantile", alpha=alpha, **BASE_LGB_PARAMS)
        m.fit(X_train, y_train)
        bundle[alpha] = m
    return bundle


def _predict_lgb_bundle(bundle, X_test):
    preds = {alpha: m.predict(X_test) for alpha, m in bundle.items()}
    scores = np.array([
        np.clip(_score_from_quantiles(preds[0.1][i], preds[0.5][i], preds[0.9][i]), 0.0, 1.0)
        for i in range(len(X_test))
    ])
    return preds[0.5], scores


def _train_predict_lgb(X_train, y_train, X_test):
    bundle = _fit_lgb_bundle(X_train, y_train)
    return _predict_lgb_bundle(bundle, X_test)


def _train_predict_linear_roni0(X_train, y_train, X_test, feature_cols):
    from sklearn.linear_model import LinearRegression

    if "roni_lag_0" not in feature_cols:
        return np.zeros(len(X_test))
    col_idx = feature_cols.index("roni_lag_0")
    x_tr = np.nan_to_num(X_train[:, col_idx : col_idx + 1], nan=0.0)
    x_te = np.nan_to_num(X_test[:, col_idx : col_idx + 1], nan=0.0)
    lr = LinearRegression()
    lr.fit(x_tr, y_train)
    return lr.predict(x_te)


def _eval_regression_metrics(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    sp = _safe_spearman(y_pred, y_true)
    return {"mae": round(mae, 4), "rmse": round(rmse, 4), "spearman": sp, "n": int(len(y_true))}


def run_group_cv(df: pd.DataFrame, feature_cols: list, group_col: str) -> dict:
    """
    Ejecuta CV dejando fuera un grupo completo (campaña `season` o zona `zone_id`).
    Compara LightGBM (Q50) contra baseline cero y regresión lineal solo con roni_lag_0.
    """
    valid_df = df[(~df["is_prediction_row"]) & (df["target_ndvi_anom"].notna())].copy()
    groups = sorted(valid_df[group_col].unique())

    y_all, p_lgb_all, p_zero_all, p_lin_all = [], [], [], []
    per_group = {}

    for g in groups:
        tr = valid_df[valid_df[group_col] != g]
        te = valid_df[valid_df[group_col] == g]
        if len(tr) < 10 or len(te) == 0:
            continue

        X_tr = tr[feature_cols].astype(float).values
        y_tr = tr["target_ndvi_anom"].astype(float).values
        X_te = te[feature_cols].astype(float).values
        y_te = te["target_ndvi_anom"].astype(float).values

        lgb_q50, _ = _train_predict_lgb(X_tr, y_tr, X_te)
        lin_pred = _train_predict_linear_roni0(X_tr, y_tr, X_te, feature_cols)
        zero_pred = np.zeros_like(y_te)

        y_all.extend(y_te)
        p_lgb_all.extend(lgb_q50)
        p_zero_all.extend(zero_pred)
        p_lin_all.extend(lin_pred)

        per_group[str(g)] = {
            "n": int(len(y_te)),
            "lgb_rmse": round(float(np.sqrt(np.mean((y_te - lgb_q50) ** 2))), 4),
            "zero_rmse": round(float(np.sqrt(np.mean((y_te - zero_pred) ** 2))), 4),
            "linear_roni0_rmse": round(float(np.sqrt(np.mean((y_te - lin_pred) ** 2))), 4),
        }

    if not y_all:
        return {"error": f"Datos insuficientes para CV por {group_col}"}

    lgb_m = _eval_regression_metrics(y_all, p_lgb_all)
    zero_m = _eval_regression_metrics(y_all, p_zero_all)
    lin_m = _eval_regression_metrics(y_all, p_lin_all)

    beats_zero = lgb_m["rmse"] < zero_m["rmse"]
    beats_linear = lgb_m["rmse"] < lin_m["rmse"]

    if beats_zero and beats_linear:
        verdict = (
            f"LightGBM supera ambas baselines en {group_col} "
            f"(RMSE LGB={lgb_m['rmse']:.4f} < lineal={lin_m['rmse']:.4f}, cero={zero_m['rmse']:.4f})."
        )
    else:
        verdict = (
            f"LightGBM NO supera ambas baselines en {group_col} "
            f"(RMSE LGB={lgb_m['rmse']:.4f}, lineal={lin_m['rmse']:.4f}, cero={zero_m['rmse']:.4f}). "
            "Resultado reportado tal cual."
        )

    return {
        "group_col": group_col,
        "lgb": lgb_m,
        "baseline_zero": zero_m,
        "baseline_linear_roni0": lin_m,
        "beats_zero": beats_zero,
        "beats_linear_roni0": beats_linear,
        "verdict": verdict,
        "per_group": per_group,
    }


def _load_pumani_display_sectors(input_dir: str) -> list:
    sectors_path = os.path.join(input_dir, "sectors.geojson")
    if not os.path.exists(sectors_path):
        return []
    with open(sectors_path, "r", encoding="utf-8") as f:
        gj = json.load(f)
    sids = [
        feat["properties"]["sector_id"]
        for feat in gj["features"]
        if feat["properties"].get("zone_id") == "pumani" and feat["properties"].get("display", False)
    ]
    return sorted(sids, key=lambda s: int(s[1:]) if s[1:].isdigit() else 999)


def run_backtest(
    df: pd.DataFrame,
    feature_cols: list,
    event_key: str,
    monthly_df: pd.DataFrame = None,
    display_sids: list = None,
    cv_verdict: str = "",
) -> dict:
    """Backtest de un evento reteniendo todas sus campañas fuera del entrenamiento en todas las zonas."""
    ev = EVENTS[event_key]
    held_years = ev["camp_years"]

    df = df.copy()
    df["_camp_year"] = df["season"].apply(_season_to_camp_year)

    valid_df = df[(~df["is_prediction_row"]) & (df["target_ndvi_anom"].notna())].copy()
    train_df = valid_df[~valid_df["_camp_year"].isin(held_years)].copy()
    test_df = valid_df[valid_df["_camp_year"].isin(held_years)].copy()

    if len(train_df) < 10 or len(test_df) == 0:
        return None

    X_train = train_df[feature_cols].astype(float).values
    y_train = train_df["target_ndvi_anom"].astype(float).values
    X_test = test_df[feature_cols].astype(float).values
    y_test = test_df["target_ndvi_anom"].astype(float).values

    bundle = _fit_lgb_bundle(X_train, y_train)
    q50_pred, risk_scores = _predict_lgb_bundle(bundle, X_test)
    lin_pred = _train_predict_linear_roni0(X_train, y_train, X_test, feature_cols)
    zero_pred = np.zeros_like(y_test)

    lgb_rmse = float(np.sqrt(np.mean((y_test - q50_pred) ** 2)))
    zero_rmse = float(np.sqrt(np.mean((y_test - zero_pred) ** 2)))
    lin_rmse = float(np.sqrt(np.mean((y_test - lin_pred) ** 2)))
    beats = (lgb_rmse < zero_rmse) and (lgb_rmse < lin_rmse)

    test_df["predicted_risk"] = risk_scores

    # Filtrar solo Pumani (y display=true si disponible) para el resultado principal de la comunidad
    pumani_test = test_df[test_df["zone_id"] == "pumani"].copy()
    if display_sids:
        pumani_test = pumani_test[pumani_test["sector_id"].isin(display_sids)].copy()

    risk_by_cy = pumani_test.groupby("_camp_year")["predicted_risk"].mean().to_dict()

    # Serie temporal mensual de la zona Pumani con climatología desde 2000
    series = []
    if monthly_df is not None and len(monthly_df) > 0:
        pm = monthly_df[monthly_df["zone_id"] == "pumani"].copy()
        if display_sids:
            pm = pm[pm["sector_id"].isin(display_sids)].copy()
        pm["date_dt"] = pd.to_datetime(pm["date"] + "-01")
        pm["year"] = pm["date_dt"].dt.year
        pm["month"] = pm["date_dt"].dt.month
        pm["camp_year"] = pm["year"].where(pm["month"] >= 7, pm["year"] - 1)

        # Serie zonal agregada por mes (media de sectores display en ndvi; clima ya es de zona)
        zone_m = pm.groupby(["date", "date_dt", "year", "month", "camp_year"], as_index=False).agg(
            ndvi=("ndvi", "mean"),
            precip_mm=("precip_mm", "first"),
            roni=("roni", "first"),
        ).sort_values("date_dt")
        roni_by_dt = zone_m.set_index("date_dt")["roni"]

        # Climatología por mes desde 2000
        clim_stats = zone_m.groupby("month").agg(
            ndvi_mean=("ndvi", "mean"),
            ndvi_std=("ndvi", "std"),
            precip_mean=("precip_mm", "mean"),
        )

        ev_m = zone_m[(zone_m["date"] >= ev["start"]) & (zone_m["date"] <= ev["end"])].sort_values("date")
        for _, r in ev_m.iterrows():
            m = int(r["month"])
            cy = int(r["camp_year"])
            dt_cur = r["date_dt"]
            c_row = clim_stats.loc[m]

            ndvi_anom = None
            if pd.notna(r["ndvi"]) and pd.notna(c_row["ndvi_std"]) and c_row["ndvi_std"] > 1e-6:
                ndvi_anom = round(float((r["ndvi"] - c_row["ndvi_mean"]) / c_row["ndvi_std"]), 4)

            precip_anom = None
            if pd.notna(r["precip_mm"]) and pd.notna(c_row["precip_mean"]) and c_row["precip_mean"] > 1e-6:
                precip_anom = round(float((r["precip_mm"] - c_row["precip_mean"]) / c_row["precip_mean"] * 100.0), 2)

            # Evaluar el modelo held-out en ese mes usando los lags de RONI observados hasta dt_cur
            cy_rows = pumani_test[pumani_test["_camp_year"] == cy]
            if len(cy_rows) > 0:
                X_m = cy_rows[feature_cols].astype(float).copy()
                for lag in range(7):
                    col_name = f"roni_lag_{lag}"
                    if col_name in X_m.columns:
                        dt_lag = dt_cur - pd.DateOffset(months=lag)
                        r_val = roni_by_dt.get(dt_lag, np.nan)
                        if pd.notna(r_val):
                            X_m[col_name] = float(r_val)
                _, m_scores = _predict_lgb_bundle(bundle, X_m.values)
                pr = float(np.mean(m_scores))
            else:
                pr = risk_by_cy.get(cy)

            series.append({
                "date": r["date"],
                "roni": round(float(r["roni"]), 3) if pd.notna(r["roni"]) else None,
                "predicted_risk": round(float(np.clip(pr, 0.0, 1.0)), 4) if pr is not None else None,
                "observed_ndvi_anomaly": ndvi_anom,
                "precip_anomaly_pct": precip_anom,
            })

    # Correlación de la serie zonal (predicted_risk vs observed_ndvi_anomaly)
    z_preds = [s["predicted_risk"] for s in series]
    z_obs = [s["observed_ndvi_anomaly"] for s in series]
    zone_sp = _safe_spearman(z_preds, z_obs)

    valid_preds = [v for v in z_preds if v is not None]
    valid_obs = [v for v in z_obs if v is not None]
    mean_pred = round(float(np.mean(valid_preds)), 4) if valid_preds else round(float(pumani_test["predicted_risk"].mean()), 4)
    mean_obs = round(float(np.mean(valid_obs)), 4) if valid_obs else round(float(pumani_test["target_ndvi_anom"].mean()), 4)

    if zone_sp is None:
        zone_metric_note = (
            "El modelo predice un riesgo único por campaña (al 1 de octubre); en eventos de una sola "
            "campaña la serie mensual tiene varianza nula en predicted_risk y Spearman no aplica (null)."
        )
    else:
        zone_metric_note = "Correlación de Spearman entre riesgo predicho y anomalía de NDVI observada, mes a mes."

    # Evidencia secundaria por sector (solo Pumani display=true, promediado si el evento tiene 2 campañas)
    per_sector_df = (
        pumani_test.groupby("sector_id", as_index=False)
        .agg(
            predicted_risk=("predicted_risk", "mean"),
            observed_ndvi_anomaly=("target_ndvi_anom", "mean"),
        )
    )
    per_sector_df["_order"] = per_sector_df["sector_id"].apply(lambda s: int(s[1:]) if s[1:].isdigit() else 999)
    per_sector_df = per_sector_df.sort_values("_order")

    per_sector = [
        {
            "sector_id": r["sector_id"],
            "predicted_risk": round(float(np.clip(r["predicted_risk"], 0.0, 1.0)), 4),
            "observed_ndvi_anomaly": round(float(r["observed_ndvi_anomaly"]), 4),
        }
        for _, r in per_sector_df.iterrows()
    ]

    ps_sp = _safe_spearman(
        [x["predicted_risk"] for x in per_sector],
        [x["observed_ndvi_anomaly"] for x in per_sector],
    )
    per_sector_note = (
        f"Con {len(per_sector)} sectores la correlación no es confiable. "
        "Es evidencia secundaria (solo NDVI, sin diferencias climáticas entre sectores)."
    )

    event_note = (
        f"Evento {event_key} fuera del entrenamiento (todas las zonas). "
        f"RMSE evento: LGB={lgb_rmse:.3f}, lineal(roni_lag_0)={lin_rmse:.3f}, cero={zero_rmse:.3f} "
        f"({'supera baselines' if beats else 'no supera ambas baselines'}). {cv_verdict}"
    ).strip()

    return {
        "event": event_key,
        "event_type": ev["event_type"],
        "held_out": True,
        "zone": {
            "id": "pumani",
            "series": series,
            "mean_predicted_risk": mean_pred,
            "mean_observed_ndvi_anomaly": mean_obs,
            "metric": {
                "spearman": zone_sp,
                "n": len(series),
                "note": zone_metric_note,
            },
        },
        "per_sector": per_sector,
        "per_sector_metric": {
            "spearman": ps_sp,
            "n": len(per_sector),
            "note": per_sector_note,
        },
        "note": event_note,
    }


def _save_backtest_figure(backtests: dict):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        os.makedirs("ml/reports", exist_ok=True)
        evs = [k for k in ["2015-16", "2020-22", "2023-24"] if k in backtests]
        if not evs:
            return
        fig, axes = plt.subplots(len(evs), 1, figsize=(10, 3.2 * len(evs)), sharex=False)
        if len(evs) == 1:
            axes = [axes]
        for ax, ek in zip(axes, evs):
            series = backtests[ek]["zone"]["series"]
            dates = [s["date"] for s in series]
            roni = [s["roni"] if s["roni"] is not None else np.nan for s in series]
            ndvi = [s["observed_ndvi_anomaly"] if s["observed_ndvi_anomaly"] is not None else np.nan for s in series]
            risk = [s["predicted_risk"] if s["predicted_risk"] is not None else np.nan for s in series]

            ax.plot(dates, ndvi, marker="o", label="Anomalía NDVI observada", color="#2b8cbe")
            ax.plot(dates, roni, linestyle="--", label="RONI (NOAA)", color="#e34a33")
            ax.axhline(0, color="gray", linewidth=0.7, alpha=0.6)
            ax.set_ylabel("Desv. est. / índice")
            ax.set_title(f"Backtest {ek} ({backtests[ek]['event_type']}) — riesgo predicho medio: {backtests[ek]['zone']['mean_predicted_risk']:.2f}")
            ax2 = ax.twinx()
            ax2.plot(dates, risk, linestyle=":", linewidth=2.0, color="#31a354", label="Riesgo predicho")
            ax2.set_ylim(0, 1)
            ax2.set_ylabel("Riesgo [0-1]")
            ax.tick_params(axis="x", rotation=45)
            lines1, labels1 = ax.get_legend_handles_labels()
            lines2, labels2 = ax2.get_legend_handles_labels()
            ax.legend(lines1 + lines2, labels1 + labels2, loc="upper right", fontsize=8)

        plt.tight_layout()
        fig.savefig("ml/reports/backtest_series.png", dpi=120)
        plt.close(fig)
        print("  → ml/reports/backtest_series.png")
    except Exception as e:
        print(f"  [WARN] No se pudo generar figura backtest: {e}")


def run(input_dir: str, output_dir: str) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("ml/reports", exist_ok=True)

    feat_path = os.path.join(input_dir, "features.csv")
    monthly_path = os.path.join(input_dir, "monthly.csv")

    df = pd.read_csv(feat_path)
    df["is_prediction_row"] = df["is_prediction_row"].astype(bool)
    monthly_df = pd.read_csv(monthly_path) if os.path.exists(monthly_path) else None
    display_sids = _load_pumani_display_sectors(input_dir)

    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]

    # 1. Validación dejando fuera una campaña completa (todas las zonas a la vez)
    print("  CV leave-one-season-out ...")
    cv_season = run_group_cv(df, feature_cols, "season")
    print(f"    {cv_season.get('verdict', '')}")

    # 2. Validación dejando fuera una zona completa
    print("  CV leave-one-zone-out ...")
    cv_zone = run_group_cv(df, feature_cols, "zone_id")
    print(f"    {cv_zone.get('verdict', '')}")

    # Guardar reporte de validación cruzada
    cv_report = {"leave_one_season_out": cv_season, "leave_one_zone_out": cv_zone}
    with open("ml/reports/validation_summary.json", "w", encoding="utf-8") as f:
        json.dump(cv_report, f, indent=2, ensure_ascii=False)
    print("  → ml/reports/validation_summary.json")

    cv_verdict = f"{cv_season.get('verdict', '')} {cv_zone.get('verdict', '')}".strip()

    # 3. Backtests de eventos (2015-16, 2023-24, 2020-22)
    backtests = {}
    for ev in EVENTS:
        print(f"  Backtest {ev} ...")
        result = run_backtest(
            df.copy(),
            feature_cols,
            ev,
            monthly_df=monthly_df,
            display_sids=display_sids,
            cv_verdict=cv_verdict,
        )
        if result is not None:
            backtests[ev] = result
        else:
            print(f"  [WARN] Backtest {ev}: datos insuficientes, omitido.")

    _save_backtest_figure(backtests)

    out_path = os.path.join(output_dir, "backtests_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(backtests, f, indent=2, ensure_ascii=False)
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
