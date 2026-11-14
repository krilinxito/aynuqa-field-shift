"""
validation.py — Validación cruzada (leave-one-season-out y leave-one-zone-out),
comparación contra baselines (siempre 0 y regresión lineal con roni_lag_0),
backtests sin fuga de 2015-16, 2023-24 y 2020-22, y reporte en <salida>/reports/.

El modelo pronostica una vez por campaña, a inicios de octubre. Por eso el backtest trabaja
con un riesgo por campaña:
- Cada campaña se predice con un modelo que no la vio. Si la campaña es parte de un evento de
  varias campañas (La Niña 2020-22), el modelo tampoco vio el resto del evento.
- La métrica principal es la serie de la zona: riesgo medio de Pumani en cada campaña contra la
  anomalía de NDVI observada de febrero a abril, en todas las campañas con dato.
- La serie mensual del contrato muestra, para cada mes del evento, ese mismo pronóstico desde
  octubre (vacío de julio a septiembre, antes de decidir), junto al NDVI y la lluvia observados.
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
DECISION_MONTH = 10  # el pronóstico se emite a inicios de octubre


def _season_to_camp_year(season: str) -> int:
    return int(str(season).split("-")[0])


def _cv_group(season: str) -> str:
    """Grupo que se deja fuera junto: la campaña, o el evento completo si dura varias campañas."""
    cy = _season_to_camp_year(season)
    for key, ev in EVENTS.items():
        if len(ev["camp_years"]) > 1 and cy in ev["camp_years"]:
            return key
    return str(season)


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


def _rmse(a, b) -> float:
    return float(np.sqrt(np.mean((np.asarray(a, dtype=float) - np.asarray(b, dtype=float)) ** 2)))


def _valid_rows(df: pd.DataFrame) -> pd.DataFrame:
    return df[(~df["is_prediction_row"]) & (df["target_ndvi_anom"].notna())].copy()


def run_group_cv(df: pd.DataFrame, feature_cols: list, group_col: str) -> dict:
    """
    Ejecuta CV dejando fuera un grupo completo (campaña `season` o zona `zone_id`).
    Compara LightGBM (Q50) contra baseline cero y regresión lineal solo con roni_lag_0.
    """
    valid_df = _valid_rows(df)
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
            "lgb_rmse": round(_rmse(y_te, lgb_q50), 4),
            "zero_rmse": round(_rmse(y_te, zero_pred), 4),
            "linear_roni0_rmse": round(_rmse(y_te, lin_pred), 4),
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


def out_of_fold(df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    """Predicción de cada fila con un modelo que no vio su campaña (ni el resto de su evento).

    Devuelve las filas válidas con oof_q50, oof_risk (LightGBM) y oof_linear (base con roni_lag_0).
    """
    valid = _valid_rows(df)
    valid["_group"] = valid["season"].map(_cv_group)
    valid["_camp_year"] = valid["season"].map(_season_to_camp_year)
    parts = []
    for g, te in valid.groupby("_group"):
        tr = valid[valid["_group"] != g]
        if len(tr) < 10:
            continue
        X_tr = tr[feature_cols].astype(float).values
        y_tr = tr["target_ndvi_anom"].astype(float).values
        X_te = te[feature_cols].astype(float).values
        bundle = _fit_lgb_bundle(X_tr, y_tr)
        q50, risk = _predict_lgb_bundle(bundle, X_te)
        lin = _train_predict_linear_roni0(X_tr, y_tr, X_te, feature_cols)
        parts.append(te.assign(oof_q50=q50, oof_risk=risk, oof_linear=lin))
    return pd.concat(parts) if parts else valid.iloc[0:0]


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


def _zone_monthly(monthly_df: pd.DataFrame, display_sids: list) -> pd.DataFrame:
    """Serie mensual de Pumani: NDVI sin tendencia medio de los sectores mostrados, lluvia y RONI."""
    pm = monthly_df[monthly_df["zone_id"] == "pumani"].copy()
    if display_sids:
        pm = pm[pm["sector_id"].isin(display_sids)]
    zone_m = pm.groupby("date", as_index=False).agg(
        ndvi_anom=("ndvi_anom", "mean"),
        precip_mm=("precip_mm", "first"),
        roni=("roni", "first"),
    ).sort_values("date")
    zone_m["month"] = zone_m["date"].str[5:7].astype(int)
    year = zone_m["date"].str[:4].astype(int)
    zone_m["camp_year"] = year.where(zone_m["month"] >= 7, year - 1)
    precip_clim = zone_m.groupby("month")["precip_mm"].mean()
    zone_m["precip_anomaly_pct"] = (
        (zone_m["precip_mm"] - zone_m["month"].map(precip_clim)) / zone_m["month"].map(precip_clim) * 100.0
    )
    return zone_m


def _opt(value, ndigits):
    return None if value is None or pd.isna(value) else round(float(value), ndigits)


def run_backtest(
    oof: pd.DataFrame,
    event_key: str,
    zone_monthly: pd.DataFrame,
    display_sids: list,
    cv_verdict: str = "",
) -> dict | None:
    """Backtest de un evento con las predicciones fuera de muestra (el evento no se usó al entrenar)."""
    ev = EVENTS[event_key]
    held_years = ev["camp_years"]

    pumani = oof[oof["zone_id"] == "pumani"]
    if display_sids:
        pumani = pumani[pumani["sector_id"].isin(display_sids)]
    event_rows = pumani[pumani["_camp_year"].isin(held_years)]
    if event_rows.empty:
        return None

    # Serie de la zona por campaña: el backtest principal
    by_season = pumani.groupby("_camp_year").agg(
        risk=("oof_risk", "mean"), observed=("target_ndvi_anom", "mean")
    ).sort_index()
    zone_sp = _safe_spearman(by_season["risk"], by_season["observed"])

    series = []
    window = zone_monthly[(zone_monthly["date"] >= ev["start"]) & (zone_monthly["date"] <= ev["end"])]
    for _, r in window.iterrows():
        forecast_issued = r["month"] >= DECISION_MONTH or r["month"] <= 6
        risk = by_season["risk"].get(r["camp_year"]) if forecast_issued else None
        series.append({
            "date": r["date"],
            "roni": _opt(r["roni"], 3),
            "predicted_risk": None if risk is None or pd.isna(risk) else round(float(np.clip(risk, 0.0, 1.0)), 4),
            "observed_ndvi_anomaly": _opt(r["ndvi_anom"], 4),
            "precip_anomaly_pct": _opt(r["precip_anomaly_pct"], 2),
        })

    event_seasons = by_season.loc[by_season.index.isin(held_years)]
    zone_note = (
        f"Spearman entre el riesgo predicho y la anomalía de NDVI de febrero a abril en las "
        f"{len(by_season)} campañas de Pumani, cada una predicha con un modelo que no la vio. "
        "Se espera un valor negativo: más riesgo, menos verdor. La serie mensual repite el "
        "pronóstico de cada campaña desde octubre; de julio a septiembre aún no hay pronóstico."
    )

    # Evidencia secundaria por sector (solo NDVI)
    per_sector_df = event_rows.groupby("sector_id", as_index=False).agg(
        predicted_risk=("oof_risk", "mean"), observed_ndvi_anomaly=("target_ndvi_anom", "mean")
    )
    per_sector_df = per_sector_df.sort_values(
        "sector_id", key=lambda s: s.str[1:].astype(int)
    )
    per_sector = [
        {
            "sector_id": r["sector_id"],
            "predicted_risk": round(float(np.clip(r["predicted_risk"], 0.0, 1.0)), 4),
            "observed_ndvi_anomaly": round(float(r["observed_ndvi_anomaly"]), 4),
        }
        for _, r in per_sector_df.iterrows()
    ]
    ps_sp = _safe_spearman(
        [x["predicted_risk"] for x in per_sector], [x["observed_ndvi_anomaly"] for x in per_sector]
    )
    per_sector_note = (
        f"Con {len(per_sector)} sectores la correlación no es confiable. "
        "Es evidencia secundaria (solo NDVI, sin diferencias climáticas entre sectores)."
    )

    # Error del evento en todas las zonas, contra las bases
    all_event = oof[oof["_camp_year"].isin(held_years)]
    y = all_event["target_ndvi_anom"].to_numpy(dtype=float)
    lgb_rmse = _rmse(y, all_event["oof_q50"])
    lin_rmse = _rmse(y, all_event["oof_linear"])
    zero_rmse = _rmse(y, np.zeros_like(y))
    beats = lgb_rmse < zero_rmse and lgb_rmse < lin_rmse
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
            "mean_predicted_risk": round(float(np.clip(event_seasons["risk"].mean(), 0.0, 1.0)), 4),
            "mean_observed_ndvi_anomaly": round(float(event_seasons["observed"].mean()), 4),
            "metric": {"spearman": zone_sp, "n": int(len(by_season)), "note": zone_note},
        },
        "per_sector": per_sector,
        "per_sector_metric": {"spearman": ps_sp, "n": len(per_sector), "note": per_sector_note},
        "note": event_note,
    }


def _save_backtest_figure(backtests: dict, reports_dir: str):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        os.makedirs(reports_dir, exist_ok=True)
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
        out = os.path.join(reports_dir, "backtest_series.png")
        fig.savefig(out, dpi=120)
        plt.close(fig)
        print(f"  → {out}")
    except Exception as e:
        print(f"  [WARN] No se pudo generar figura backtest: {e}")


def run(input_dir: str, output_dir: str) -> dict:
    reports_dir = os.path.join(output_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    df = pd.read_csv(os.path.join(input_dir, "features.csv"))
    df["is_prediction_row"] = df["is_prediction_row"].astype(bool)
    monthly_df = pd.read_csv(os.path.join(input_dir, "monthly.csv"))
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

    cv_report = {"leave_one_season_out": cv_season, "leave_one_zone_out": cv_zone}
    # La exportación lo lee para limitar la confianza si el modelo no supera las bases.
    for path in (os.path.join(output_dir, "validation_summary.json"),
                 os.path.join(reports_dir, "validation_summary.json")):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cv_report, f, indent=2, ensure_ascii=False)
    print(f"  → {os.path.join(output_dir, 'validation_summary.json')}")

    cv_verdict = f"{cv_season.get('verdict', '')} {cv_zone.get('verdict', '')}".strip()

    # 3. Backtests de eventos con predicciones fuera de muestra
    print("  Predicciones fuera de muestra por campaña ...")
    oof = out_of_fold(df, feature_cols)
    zone_m = _zone_monthly(monthly_df, display_sids)
    backtests = {}
    for ev in EVENTS:
        print(f"  Backtest {ev} ...")
        result = run_backtest(oof, ev, zone_m, display_sids, cv_verdict)
        if result is not None:
            backtests[ev] = result
        else:
            print(f"  [WARN] Backtest {ev}: Pumani no tiene NDVI en ese evento, omitido.")

    _save_backtest_figure(backtests, reports_dir)

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
