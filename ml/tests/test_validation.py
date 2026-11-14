"""
test_validation.py — Tests de métricas del backtest.
"""
import json
import os
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = str(REPO_ROOT / "ml" / "outputs_fake")
FAKE_INPUT = str(REPO_ROOT / "ml" / "data" / "fake")


@pytest.fixture(scope="module")
def backtests_raw():
    """Corre validación si no existe el archivo, devuelve el contenido."""
    path = os.path.join(OUTPUT_DIR, "backtests_raw.json")
    if not os.path.exists(path):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        # Asegurarse de que haya datos fake
        if not os.path.exists(os.path.join(FAKE_INPUT, "features.csv")):
            from ml.models.fake_data import generate_sectors_geojson, generate_monthly_csv, generate_features_csv
            os.makedirs(FAKE_INPUT, exist_ok=True)
            sp = generate_sectors_geojson(FAKE_INPUT)
            mdf = generate_monthly_csv(sp, FAKE_INPUT)
            generate_features_csv(mdf, sp, FAKE_INPUT)
        from ml.models import validation
        validation.run(FAKE_INPUT, OUTPUT_DIR)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def test_backtests_raw_has_all_events(backtests_raw):
    for ev in ["2015-16", "2023-24", "2020-22"]:
        assert ev in backtests_raw, f"Evento {ev} no encontrado en backtests_raw.json"


def test_backtest_zone_structure(backtests_raw):
    for ev, bt in backtests_raw.items():
        zone = bt["zone"]
        assert "id" in zone
        assert "series" in zone
        assert isinstance(zone["series"], list)
        assert "mean_predicted_risk" in zone
        assert "mean_observed_ndvi_anomaly" in zone
        assert "metric" in zone


def test_backtest_metric_spearman(backtests_raw):
    for ev, bt in backtests_raw.items():
        metric = bt["zone"]["metric"]
        assert "spearman" in metric
        assert "n" in metric
        assert "note" in metric
        # spearman puede ser None si muestra insuficiente, o float entre -1 y 1
        if metric["spearman"] is not None:
            assert -1.0 <= metric["spearman"] <= 1.0, f"Spearman fuera de rango: {metric['spearman']}"


def test_backtest_per_sector(backtests_raw):
    for ev, bt in backtests_raw.items():
        per_sector = bt["per_sector"]
        assert isinstance(per_sector, list)
        for item in per_sector:
            assert "sector_id" in item
            assert "predicted_risk" in item
            assert "observed_ndvi_anomaly" in item
            if item["predicted_risk"] is not None:
                assert 0.0 <= item["predicted_risk"] <= 1.0


def test_backtest_held_out_true(backtests_raw):
    for ev, bt in backtests_raw.items():
        assert bt["held_out"] is True


def test_backtest_event_types(backtests_raw):
    expected_types = {
        "2015-16": "nino",
        "2023-24": "nino",
        "2020-22": "nina",
    }
    for ev, bt in backtests_raw.items():
        if ev in expected_types:
            assert bt["event_type"] == expected_types[ev]


def test_backtest_mean_risk_in_range(backtests_raw):
    for ev, bt in backtests_raw.items():
        mpr = bt["zone"]["mean_predicted_risk"]
        if mpr is not None:
            assert 0.0 <= mpr <= 1.0, f"mean_predicted_risk fuera de rango en {ev}: {mpr}"


def test_backtest_series_entries(backtests_raw):
    """Cada entrada de la serie tiene todos los campos requeridos."""
    required_fields = ["date", "roni", "predicted_risk", "observed_ndvi_anomaly", "precip_anomaly_pct"]
    for ev, bt in backtests_raw.items():
        for entry in bt["zone"]["series"]:
            for field in required_fields:
                assert field in entry, f"Campo {field} faltante en serie de {ev}"


def test_backtest_note_exists(backtests_raw):
    """El note del per_sector_metric debe existir y ser honesto."""
    for ev, bt in backtests_raw.items():
        psm = bt["per_sector_metric"]
        assert "note" in psm
        # La nota no debe estar vacía si hay suficiente muestra
        # (puede ser None solo si n=0)
        if psm["n"] > 0:
            assert psm["note"] is not None
