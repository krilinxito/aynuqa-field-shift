"""
test_validation.py — Tests de validación cruzada (por campaña y por zona),
baselines, backtests y figuras en ml/reports/.
"""
import json
import math
import os
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = str(REPO_ROOT / "ml" / "outputs_fake")
FAKE_INPUT = str(REPO_ROOT / "ml" / "data" / "fake")
REPORTS_DIR = REPO_ROOT / "ml" / "reports"


@pytest.fixture(scope="module")
def validation_outputs():
    """Asegura que correrán drought_model y validation sobre datos fake y devuelve el estado."""
    if not os.path.exists(os.path.join(FAKE_INPUT, "features.csv")):
        from ml.models.fake_data import (
            generate_features_csv,
            generate_monthly_csv,
            generate_sectors_geojson,
        )
        os.makedirs(FAKE_INPUT, exist_ok=True)
        sp = generate_sectors_geojson(FAKE_INPUT)
        mdf = generate_monthly_csv(sp, FAKE_INPUT)
        generate_features_csv(mdf, sp, FAKE_INPUT)

    from ml.models import drought_model, validation
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    drought_model.run(FAKE_INPUT, OUTPUT_DIR)
    validation.run(FAKE_INPUT, OUTPUT_DIR)

    with open(os.path.join(OUTPUT_DIR, "backtests_raw.json"), encoding="utf-8") as f:
        backtests = json.load(f)
    with open(REPORTS_DIR / "validation_summary.json", encoding="utf-8") as f:
        cv_summary = json.load(f)
    return backtests, cv_summary


def test_backtests_raw_has_all_events(validation_outputs):
    backtests, _ = validation_outputs
    for ev in ["2015-16", "2023-24", "2020-22"]:
        assert ev in backtests, f"Evento {ev} no encontrado en backtests_raw.json"


def test_backtest_zone_structure_and_no_nan(validation_outputs):
    backtests, _ = validation_outputs
    for ev, bt in backtests.items():
        zone = bt["zone"]
        assert zone["id"] == "pumani"
        assert isinstance(zone["series"], list)
        assert len(zone["series"]) >= 12
        assert 0.0 <= zone["mean_predicted_risk"] <= 1.0
        sp = zone["metric"]["spearman"]
        if sp is not None:
            assert not math.isnan(sp)
            assert -1.0 <= sp <= 1.0


def test_backtest_per_sector_unique_13(validation_outputs):
    backtests, _ = validation_outputs
    expected_sids = [f"S{i}" for i in range(1, 14)]
    for ev, bt in backtests.items():
        sids = [x["sector_id"] for x in bt["per_sector"]]
        assert sids == expected_sids, f"{ev} tiene per_sector={sids}"
        for item in bt["per_sector"]:
            assert 0.0 <= item["predicted_risk"] <= 1.0
            assert not math.isnan(item["observed_ndvi_anomaly"])
        assert bt["per_sector_metric"]["n"] == 13
        assert "no es confiable" in bt["per_sector_metric"]["note"].lower()


def test_backtest_held_out_and_event_types(validation_outputs):
    backtests, _ = validation_outputs
    expected_types = {"2015-16": "nino", "2023-24": "nino", "2020-22": "nina"}
    for ev, bt in backtests.items():
        assert bt["held_out"] is True
        assert bt["event_type"] == expected_types[ev]


def test_cv_leave_one_season_and_zone_with_baselines(validation_outputs):
    _, cv_summary = validation_outputs
    for key in ("leave_one_season_out", "leave_one_zone_out"):
        cv = cv_summary[key]
        assert "lgb" in cv
        assert "baseline_zero" in cv
        assert "baseline_linear_roni0" in cv
        assert "beats_zero" in cv
        assert "beats_linear_roni0" in cv
        assert isinstance(cv["verdict"], str) and len(cv["verdict"]) > 0
        assert cv["lgb"]["n"] > 0


def test_reports_figures_exist(validation_outputs):
    assert (REPORTS_DIR / "shap_importance.png").exists()
    assert (REPORTS_DIR / "backtest_series.png").exists()
