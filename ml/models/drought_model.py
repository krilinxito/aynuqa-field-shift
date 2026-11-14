"""
drought_model.py — LightGBM con regresión por cuantiles (Q10, Q50, Q90).
Entrena en features.csv (filas no-prediction con target válido), predice en is_prediction_row.
Intervalo y confianza calculados por dispersión del puntaje entre modelos de validación cruzada (por campaña).
Salida: predictions_raw.json y <salida>/reports/shap_importance.png.
"""
import argparse
import json
import os
import warnings

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# rotation_years queda fuera: la rotacion es simulada y no debe explicar un riesgo real.
# Solo la usan las reglas de recomendacion.
EXCLUDE_COLS = {
    "zone_id", "sector_id", "season", "target_ndvi_anom",
    "is_prediction_row", "lat", "lon", "latitude", "longitude",
    "rotation_years",
}

# roni_lag_0 es la temporada julio-agosto-septiembre (centrada en agosto), la ultima que NOAA
# publica a inicios de octubre; roni_lag_k es la temporada centrada k meses antes.
FEATURE_LABELS = {
    "roni_lag_0": "El Niño (índice RONI de julio a septiembre)",
    "roni_lag_1": "El Niño (índice RONI de junio a agosto)",
    "roni_lag_2": "El Niño (índice RONI de mayo a julio)",
    "roni_lag_3": "El Niño (índice RONI de abril a junio)",
    "roni_lag_4": "El Niño (índice RONI de marzo a mayo)",
    "roni_lag_5": "El Niño (índice RONI de febrero a abril)",
    "roni_lag_6": "El Niño (índice RONI de enero a marzo)",
    "precip_anom_3m": "Lluvia de julio a septiembre",
    "precip_anom_12m": "Lluvia de los últimos 12 meses",
    "temp_anom_3m": "Temperatura de julio a septiembre",
    "soil_moisture_anom": "Humedad del suelo en septiembre",
    "ndvi_anom_prev_peak": "Estado de la vegetación en campaña anterior",
    "ndvi_anom_sep": "Estado de la vegetación en septiembre",
    "elevation_m": "Altitud del sector",
    "slope_pct": "Pendiente del terreno",
    "aspect_sin": "Orientación del terreno (este-oeste)",
    "aspect_cos": "Orientación del terreno (norte-sur)",
}

DROUGHT_THRESHOLD = -0.5  # Umbral provisional de anomalía de NDVI

BASE_LGB_PARAMS = dict(
    max_depth=3,
    num_leaves=7,
    min_data_in_leaf=10,
    learning_rate=0.05,
    n_estimators=80,
    reg_alpha=0.5,
    reg_lambda=5.0,
    subsample=0.8,
    subsample_freq=1,
    colsample_bytree=0.8,
    random_state=42,
    verbose=-1,
)


def _score_from_quantiles(q10: float, q50: float, q90: float, threshold: float = DROUGHT_THRESHOLD) -> float:
    """
    Estima P(target_ndvi_anom < threshold) a partir de los cuantiles Q10, Q50, Q90.
    """
    # Garantizar monotonicidad de cuantiles
    qs = sorted([float(q10), float(q50), float(q90)])
    q10_s, q50_s, q90_s = qs[0], qs[1], qs[2]

    if q90_s - q10_s < 1e-6:
        return 0.9 if q50_s < threshold else 0.1

    if threshold <= q10_s:
        # Cola inferior: decrece suavemente desde 0.10
        spread = max(q50_s - q10_s, 0.2)
        p = 0.10 * np.exp((threshold - q10_s) / spread)
        return float(np.clip(p, 0.02, 0.10))
    if threshold <= q50_s:
        frac = (threshold - q10_s) / max(q50_s - q10_s, 1e-6)
        return float(0.10 + frac * 0.40)
    if threshold <= q90_s:
        frac = (threshold - q50_s) / max(q90_s - q50_s, 1e-6)
        return float(0.50 + frac * 0.40)
    # Cola superior: crece suavemente desde 0.90 hacia 0.98
    spread = max(q90_s - q50_s, 0.2)
    p = 1.0 - 0.10 * np.exp((q90_s - threshold) / spread)
    return float(np.clip(p, 0.90, 0.98))


def _level(score: float) -> str:
    if score < 0.33:
        return "low"
    elif score < 0.66:
        return "medium"
    return "high"


def _conf_label(conf: float) -> str:
    if conf < 0.4:
        return "baja"
    elif conf <= 0.7:
        return "media"
    return "alta"


def _clip01(x: float) -> float:
    return float(np.clip(x, 0.0, 1.0))


def _fit_quantile_bundle(X: pd.DataFrame, y: pd.Series) -> dict:
    import lightgbm as lgb

    bundle = {}
    for alpha in [0.1, 0.5, 0.9]:
        m = lgb.LGBMRegressor(objective="quantile", alpha=alpha, **BASE_LGB_PARAMS)
        m.fit(X, y)
        bundle[alpha] = m
    return bundle


def _predict_scores_bundle(bundle: dict, X: pd.DataFrame) -> np.ndarray:
    q10 = bundle[0.1].predict(X)
    q50 = bundle[0.5].predict(X)
    q90 = bundle[0.9].predict(X)
    return np.array([
        _clip01(_score_from_quantiles(q10[i], q50[i], q90[i]))
        for i in range(len(X))
    ]), q10, q50, q90


def run(input_dir: str, output_dir: str) -> dict:
    import shap
    from sklearn.model_selection import GroupKFold

    os.makedirs(output_dir, exist_ok=True)

    feat_path = os.path.join(input_dir, "features.csv")
    df = pd.read_csv(feat_path)
    df["is_prediction_row"] = df["is_prediction_row"].astype(bool)

    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]

    train_df = df[(~df["is_prediction_row"]) & (df["target_ndvi_anom"].notna())].copy()
    pred_df = df[df["is_prediction_row"]].copy()

    if len(train_df) < 10:
        raise ValueError(f"Muy pocas filas de entrenamiento válidas: {len(train_df)}")
    if len(pred_df) == 0:
        raise ValueError("No hay filas con is_prediction_row=True en features.csv")

    X_train = train_df[feature_cols].astype(float)
    y_train = train_df["target_ndvi_anom"].astype(float)

    # 1. Modelo principal entrenado con todas las campañas pasadas
    models = _fit_quantile_bundle(X_train, y_train)

    # 2. Modelos de validación cruzada por campaña (GroupKFold) para estimar dispersión (intervalo y confianza)
    seasons_groups = train_df["season"].values
    n_unique_seasons = len(np.unique(seasons_groups))
    n_splits = min(5, n_unique_seasons)
    cv_bundles = []
    if n_splits >= 2:
        gkf = GroupKFold(n_splits=n_splits)
        for tr_idx, _ in gkf.split(X_train, y_train, groups=seasons_groups):
            cv_bundles.append(_fit_quantile_bundle(X_train.iloc[tr_idx], y_train.iloc[tr_idx]))

    # 3. SHAP global sobre el modelo mediano (Q50)
    explainer = shap.TreeExplainer(models[0.5])
    shap_vals = explainer.shap_values(X_train)
    global_shap = np.abs(shap_vals).mean(axis=0)
    global_shap_norm = global_shap / (global_shap.sum() + 1e-9)

    # 4. Predicciones por escenario
    results = {}
    for scenario in ["normal", "nino"]:
        X_pred = pred_df[feature_cols].astype(float).copy()
        if scenario == "normal":
            roni_cols = [c for c in feature_cols if c.startswith("roni_lag")]
            X_pred[roni_cols] = 0.0

        main_scores, q10, q50, q90 = _predict_scores_bundle(models, X_pred)

        # Dispersión del puntaje entre los modelos de validación cruzada
        if cv_bundles:
            cv_scores_mat = np.vstack([
                _predict_scores_bundle(b, X_pred)[0] for b in cv_bundles
            ])  # shape: (n_splits, n_pred)
        else:
            cv_scores_mat = main_scores[None, :]

        shap_pred = explainer.shap_values(X_pred)

        sector_results = []
        for idx, row in enumerate(pred_df.itertuples()):
            score = float(main_scores[idx])
            fold_scores = cv_scores_mat[:, idx]

            # Intervalo basado en dispersión entre modelos de CV (percentiles 10-90 o min-max si pocos folds)
            cv_low = float(np.percentile(fold_scores, 10))
            cv_high = float(np.percentile(fold_scores, 90))
            # Garantizar que el puntaje principal caiga dentro del intervalo [low, high]
            int_low = _clip01(min(cv_low, score))
            int_high = _clip01(max(cv_high, score))

            # Confianza alta cuando el intervalo entre modelos de CV es estrecho
            interval_width = max(0.0, int_high - int_low)
            conf = float(np.clip(1.0 - interval_width * 1.5, 0.05, 0.95))

            # Top-3 SHAP drivers
            # Nota: el modelo predice target_ndvi_anom; SHAP < 0 baja el NDVI -> aumenta el riesgo ("increases")
            sv = shap_pred[idx]
            top3_idx = np.argsort(np.abs(sv))[::-1][:3]
            drivers = []
            sv_total = float(np.abs(sv).sum()) + 1e-9
            for fi in top3_idx:
                fname = feature_cols[fi]
                shap_val = float(sv[fi])
                drivers.append({
                    "feature": fname,
                    "label": FEATURE_LABELS.get(fname, fname),
                    "direction": "increases" if shap_val < 0 else "decreases",
                    "weight": round(float(abs(shap_val) / sv_total), 4),
                })

            sector_results.append({
                "zone_id": row.zone_id,
                "sector_id": row.sector_id,
                "score": round(score, 4),
                "level": _level(score),
                "interval": {"low": round(int_low, 4), "high": round(int_high, 4)},
                "confidence": round(conf, 4),
                "confidence_label": _conf_label(conf),
                "drivers": drivers,
                "q10": round(float(q10[idx]), 4),
                "q50": round(float(q50[idx]), 4),
                "q90": round(float(q90[idx]), 4),
            })

        results[scenario] = sector_results

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
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"  → {out_path}")

    _save_shap_figure(shap_importance, os.path.join(output_dir, "reports"))

    return output


def _save_shap_figure(shap_importance: list, reports_dir: str):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        os.makedirs(reports_dir, exist_ok=True)
        top = shap_importance[:12]
        feats = [FEATURE_LABELS.get(x["feature"], x["feature"]) for x in top]
        vals = [x["importance"] * 100 for x in top]
        colors = [
            "#d95f02" if x["feature"].startswith("roni_lag") else "#3b75af"
            for x in top
        ]
        roni_total_pct = sum(
            x["importance"] for x in shap_importance if x["feature"].startswith("roni_lag")
        ) * 100

        fig, ax = plt.subplots(figsize=(9, 5.5))
        ax.barh(feats[::-1], vals[::-1], color=colors[::-1])
        ax.set_xlabel("Peso SHAP relativo (%)")
        ax.set_title(
            f"Importancia global SHAP (grupo RONI = {roni_total_pct:.1f}% del peso total)"
        )
        # Leyenda simple
        from matplotlib.patches import Patch
        ax.legend(
            handles=[
                Patch(facecolor="#d95f02", label="Variables RONI (El Niño)"),
                Patch(facecolor="#3b75af", label="Clima local, vegetación y terreno"),
            ],
            loc="lower right",
        )
        plt.tight_layout()
        out = os.path.join(reports_dir, "shap_importance.png")
        fig.savefig(out, dpi=120)
        plt.close(fig)
        print(f"  → {out}")
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
