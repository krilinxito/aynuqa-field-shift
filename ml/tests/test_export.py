"""
test_export.py — Corre el pipeline completo en modo fake y valida los JSON contra schemas.
"""
import json
import os
import shutil
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
CONTRACTS_DIR = REPO_ROOT / "contracts"
FAKE_INPUT = str(REPO_ROOT / "ml" / "data" / "fake")


@pytest.fixture(scope="module")
def pipeline_output():
    """Corre el pipeline completo en un directorio temporal y devuelve la ruta."""
    out_dir = str(REPO_ROOT / "ml" / "outputs_fake")
    os.makedirs(out_dir, exist_ok=True)

    # Generar datos fake
    from ml.models.fake_data import generate_sectors_geojson, generate_monthly_csv, generate_features_csv
    os.makedirs(FAKE_INPUT, exist_ok=True)
    sp = generate_sectors_geojson(FAKE_INPUT)
    mdf = generate_monthly_csv(sp, FAKE_INPUT)
    generate_features_csv(mdf, sp, FAKE_INPUT)

    # Correr modelos
    from ml.models import drought_model, validation, restrend, analogs
    from ml.export import export

    drought_model.run(FAKE_INPUT, out_dir)
    validation.run(FAKE_INPUT, out_dir)
    restrend.run(FAKE_INPUT, out_dir)
    analogs.run(FAKE_INPUT, out_dir)
    export.run(FAKE_INPUT, out_dir)

    return out_dir


def _load_schema(name):
    with open(CONTRACTS_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


def _validate(data, schema, label=""):
    import jsonschema
    try:
        validator_cls = jsonschema.Draft202012Validator
    except AttributeError:
        validator_cls = jsonschema.Draft7Validator
    validator = validator_cls(schema, format_checker=None)
    errors = list(validator.iter_errors(data))
    assert not errors, f"Schema errors in {label}:\n" + "\n".join(str(e) for e in errors[:5])


# --- predictions.json ---

def test_predictions_exists(pipeline_output):
    path = os.path.join(pipeline_output, "predictions.json")
    assert os.path.exists(path), "predictions.json no existe"


def test_predictions_scenarios(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert "scenarios" in data
    assert "normal" in data["scenarios"]
    assert "nino" in data["scenarios"]


def test_predictions_schema_normal(pipeline_output):
    schema = _load_schema("sector_risk.schema.json")
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    _validate(data["scenarios"]["normal"], schema, "predictions.json (normal)")


def test_predictions_schema_nino(pipeline_output):
    schema = _load_schema("sector_risk.schema.json")
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    _validate(data["scenarios"]["nino"], schema, "predictions.json (nino)")


def test_predictions_data_source_mock(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["scenarios"]["normal"]["data_source"] == "mock"
    assert data["scenarios"]["nino"]["data_source"] == "mock"


def test_predictions_only_pumani_display(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    for sc in ["normal", "nino"]:
        sc_data = data["scenarios"][sc]
        assert sc_data["zone"]["id"] == "pumani"
        assert len(sc_data["sectors"]) > 0
        for sec in sc_data["sectors"]:
            assert sec["id"].startswith("S")


def test_predictions_risk_levels(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    for sc in ["normal", "nino"]:
        for sec in data["scenarios"][sc]["sectors"]:
            assert sec["risk"]["level"] in ("low", "medium", "high")
            assert 0 <= sec["risk"]["score"] <= 1
            assert sec["risk"]["confidence_label"] in ("baja", "media", "alta")


# --- history.json ---

def test_history_exists(pipeline_output):
    assert os.path.exists(os.path.join(pipeline_output, "history.json"))


def test_history_structure(pipeline_output):
    with open(os.path.join(pipeline_output, "history.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert "generated_at" in data
    assert "data_source" in data
    assert "sectors" in data
    assert len(data["sectors"]) > 0


def test_history_series_schema(pipeline_output):
    """Valida cada sector contra el schema de endpoint."""
    schema = _load_schema("history.schema.json")
    with open(os.path.join(pipeline_output, "history.json"), encoding="utf-8") as f:
        data = json.load(f)
    from datetime import datetime, timezone
    for sid, series in data["sectors"].items():
        sec_obj = {
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "data_source": data["data_source"],
            "sector_id": sid,
            "from": data["from"],
            "to": data["to"],
            "series": series,
        }
        _validate(sec_obj, schema, f"history/{sid}")


def test_history_data_source_mock(pipeline_output):
    with open(os.path.join(pipeline_output, "history.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["data_source"] == "mock"


# --- backtest files ---

def test_backtest_files_exist(pipeline_output):
    for ev in ["2015-16", "2023-24", "2020-22"]:
        path = os.path.join(pipeline_output, f"backtest_{ev}.json")
        assert os.path.exists(path), f"backtest_{ev}.json no existe"


def test_backtest_schema(pipeline_output):
    schema = _load_schema("backtest.schema.json")
    for ev in ["2015-16", "2023-24", "2020-22"]:
        path = os.path.join(pipeline_output, f"backtest_{ev}.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        _validate(data, schema, f"backtest_{ev}.json")


def test_backtest_data_source(pipeline_output):
    for ev in ["2015-16", "2023-24", "2020-22"]:
        with open(os.path.join(pipeline_output, f"backtest_{ev}.json"), encoding="utf-8") as f:
            data = json.load(f)
        assert data["data_source"] == "mock"


# --- analogs.json ---

def test_analogs_exists(pipeline_output):
    assert os.path.exists(os.path.join(pipeline_output, "analogs.json"))


def test_analogs_schema(pipeline_output):
    schema = _load_schema("twin_precedent.schema.json")
    with open(os.path.join(pipeline_output, "analogs.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert "precedents" in data
    assert len(data["precedents"]) > 0
    for i, prec in enumerate(data["precedents"]):
        _validate(prec, schema, f"analogs.json[{i}]")


def test_analogs_data_source(pipeline_output):
    with open(os.path.join(pipeline_output, "analogs.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["data_source"] == "mock"


def test_analogs_is_simulated(pipeline_output):
    with open(os.path.join(pipeline_output, "analogs.json"), encoding="utf-8") as f:
        data = json.load(f)
    for prec in data["precedents"]:
        assert prec["is_simulated"] is True
