"""
drought_model.py — LightGBM con regresión por cuantiles (Q10, Q50, Q90).
Entrena en features.csv (filas no-prediction), predice en filas is_prediction_row.
Salida: predictions_raw.json con scores por sector.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

EXCLUDE_COLS = {"zone_id", "sector_id", "season", "target_ndvi_anom",
                "is_prediction_row", "lat", "lon"}

FEATURE_LABELS = {
    "roni_lag_0": "RONI actual (El Niño)",
    "roni_lag_1": "RONI año anterior",
    "roni_lag_2": "RONI hace 2 años",
    "roni_lag_3": "RONI hace 3 años",
    "roni_lag_4": "RONI hace 4 años",
    "roni_lag_5": "RONI hace 5 años",
    "roni_lag_6": "RONI hace 6 años",
    "precip_anom_3m": "Anomalía de lluvia (3 meses)",
    "precip_anom_12m": "Anomalía de lluvia (12 meses)",
    "temp_anom_3m": "Anomalía de temperatura",
    "soil_moisture_anom": "Anomalía de humedad del suelo",
    "ndvi_anom_prev_peak": "Anomalía NDVI pico anterior",
    "ndvi_anom_sep": "Anomalía NDVI septiembre",
    "elevation_m": "Altitud",
    "slope_pct": "Pendiente",
    "aspect_sin": "Aspecto (seno)",
    "aspect_cos": "Aspecto (coseno)",
    "rotation_years": "Años en estado actual",
}


def _score_from_quantiles(q10, q50, q90, threshold=-0.5):
    """Estima P(ndvi_anom < threshold) interpolando cuantiles."""
    # Aproximación lineal entre cuantiles
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


def _level(score):
    if score < 0.33:
        return "low"
    elif score < 0.66:
        return "medium"
    return "high"


def _conf_label(conf):
    if conf < 0.4:
        return "baja"
    elif conf < 0.7:
        return "media"
    return "alta"


def _clip01(x):
    return float(np.clip(x, 0.0, 1.0))


def run(input_dir, output_dir):
    import lightgbm as lgb
    import shap

    os.makedirs(output_dir, exist_ok=True)

    feat_path = os.path.join(input_dir, "features.csv")
    df = pd.read_csv(feat_path)

    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]

    train_df = df[df["is_prediction_row"] == False].copy()
    pred_df = df[df["is_prediction_row"] == True].copy()

    # Rellenar NaN en target con 0
    train_df["target_ndvi_anom"] = train_df["target_ndvi_anom"].fillna(0)

    X_train = train_df[feature_cols].astype(float)
    y_train = train_df["target_ndvi_anom"].astype(float)

    if len(X_train) < 10:
        raise ValueError(f"Muy pocas filas de entrenamiento: {len(X_train)}")

    # Parámetros base
    base_params = dict(
        num_leaves=15,
        min_data_in_leaf=5,
        learning_rate=0.05,
        n_estimators=100,
        reg_lambda=1.0,
        random_state=42,
        verbose=-1,
    )

    models = {}
    for alpha in [0.1, 0.5, 0.9]:
        m = lgb.LGBMRegressor(objective="quantile", alpha=alpha, **base_params)
        m.fit(X_train, y_train)
        models[alpha] = m

    # SHAP global (usando median model)
    explainer = shap.TreeExplainer(models[0.5])
    shap_vals = explainer.shap_values(X_train)
    global_shap = np.abs(shap_vals).mean(axis=0)
    global_shap_norm = global_shap / (global_shap.sum() + 1e-9)

    # Predicciones: escenario normal (roni_lags = 0) y nino (valores reales)
    results = {}

    for scenario in ["normal", "nino"]:
        X_pred = pred_df[feature_cols].astype(float).copy()
        if scenario == "normal":
            roni_cols = [c for c in feature_cols if c.startswith("roni_lag")]
            X_pred[roni_cols] = 0.0

        q10 = models[0.1].predict(X_pred)
        q50 = models[0.5].predict(X_pred)
        q90 = models[0.9].predict(X_pred)

        # SHAP por sector
        shap_pred = explainer.shap_values(X_pred)

        sector_results = []
        for idx, row in enumerate(pred_df.itertuples()):
            score = _score_from_quantiles(q10[idx], q50[idx], q90[idx])
            score = _clip01(score)
            # intervalo basado en Q10 y Q90 mapeados a [0,1]
            int_low = _clip01(_score_from_quantiles(q10[idx], q50[idx], q90[idx], threshold=q10[idx] - 0.1))
            int_high = _clip01(_score_from_quantiles(q10[idx], q50[idx], q90[idx], threshold=q90[idx] - 0.1))
            # confianza: inverso de dispersión (Q90-Q10), normalizado
            spread = abs(q90[idx] - q10[idx])
            conf = _clip01(1.0 - spread / 2.0)

            # Top-3 SHAP drivers
            sv = shap_pred[idx]
            top3_idx = np.argsort(np.abs(sv))[::-1][:3]
            drivers = []
            sv_total = np.abs(sv).sum() + 1e-9
            for fi in top3_idx:
                fname = feature_cols[fi]
                drivers.append({
                    "feature": fname,
                    "label": FEATURE_LABELS.get(fname, fname),
                    "direction": "increases" if sv[fi] > 0 else "decreases",
                    "weight": round(float(np.abs(sv[fi]) / sv_total), 4),
                })

            sector_results.append({
                "zone_id": row.zone_id,
                "sector_id": row.sector_id,
                "score": round(score, 4),
                "level": _level(score),
                "interval": {"low": round(min(int_low, score), 4), "high": round(max(int_high, score), 4)},
                "confidence": round(conf, 4),
                "confidence_label": _conf_label(conf),
                "drivers": drivers,
                "q10": round(float(q10[idx]), 4),
                "q50": round(float(q50[idx]), 4),
                "q90": round(float(q90[idx]), 4),
            })

        results[scenario] = sector_results

    # Global SHAP feature importance
    shap_importance = [
        {"feature": feature_cols[i], "importance": round(float(global_shap_norm[i]), 4)}
        for i in np.argsort(global_shap_norm)[::-1]
    ]

    output = {
        "scenarios": results,
        "shap_importance": shap_importance,
        "feature_cols": feature_cols,
    }

    out_path = os.path.join(output_dir, "predictions_raw.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"  → {out_path}")

    # Figura SHAP
    _save_shap_figure(shap_importance)

    return output


def _save_shap_figure(shap_importance):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        os.makedirs("ml/reports", exist_ok=True)
        top = shap_importance[:10]
        feats = [FEATURE_LABELS.get(x["feature"], x["feature"]) for x in top]
        vals = [x["importance"] for x in top]
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.barh(feats[::-1], vals[::-1])
        ax.set_xlabel("Importancia SHAP (normalizada)")
        ax.set_title("Importancia global de variables (Top 10)")
        plt.tight_layout()
        fig.savefig("ml/reports/shap_importance.png", dpi=100)
        plt.close(fig)
        print("  → ml/reports/shap_importance.png")
    except Exception as e:
        print(f"  [WARN] No se pudo generar figura SHAP: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="ml/data/fake")
    parser.add_argument("--output-dir", default="ml/outputs_fake")
    args = parser.parse_args()
    run(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
