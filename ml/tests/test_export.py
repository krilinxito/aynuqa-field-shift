"""
test_export.py — Corre el pipeline completo en modo fake y valida los JSON contra schemas
y todas las invariantes del contrato (escenarios, clima zonal, nulos, umbrales, no sobrescritura).
"""
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
CONTRACTS_DIR = REPO_ROOT / "contracts"
FAKE_INPUT = str(REPO_ROOT / "ml" / "data" / "fake")


@pytest.fixture(scope="module")
def pipeline_output():
    """Corre el pipeline completo en ml/outputs_fake y devuelve la ruta."""
    out_dir = str(REPO_ROOT / "ml" / "outputs_fake")
    os.makedirs(out_dir, exist_ok=True)

    from ml.models.fake_data import (
        generate_features_csv,
        generate_monthly_csv,
        generate_sectors_geojson,
    )

    os.makedirs(FAKE_INPUT, exist_ok=True)
    sp = generate_sectors_geojson(FAKE_INPUT)
    mdf = generate_monthly_csv(sp, FAKE_INPUT)
    generate_features_csv(mdf, sp, FAKE_INPUT)

    from ml.export import export
    from ml.models import analogs, drought_model, restrend, validation

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

    validator_cls = getattr(jsonschema, "Draft202012Validator", jsonschema.Draft7Validator)
    format_checker = getattr(validator_cls, "FORMAT_CHECKER", None)
    validator = validator_cls(schema, format_checker=format_checker)
    errors = list(validator.iter_errors(data))
    assert not errors, f"Schema errors in {label}:\n" + "\n".join(str(e) for e in errors[:5])


# --- predictions.json ---

def test_predictions_exists(pipeline_output):
    assert os.path.exists(os.path.join(pipeline_output, "predictions.json"))


def test_predictions_scenarios(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert set(data["scenarios"]) == {"normal", "nino"}


def test_predictions_schema_normal_and_nino(pipeline_output):
    schema = _load_schema("sector_risk.schema.json")
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    for sc in ("normal", "nino"):
        _validate(data["scenarios"][sc], schema, f"predictions.json ({sc})")


def test_predictions_data_source_and_timezone(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["generated_at"].endswith("-04:00")
    assert data["scenarios"]["normal"]["data_source"] == "mock"
    assert data["scenarios"]["nino"]["data_source"] == "mock"


def test_predictions_roni_and_twin_by_scenario(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)

    norm = data["scenarios"]["normal"]
    assert norm["zone"]["roni"]["kind"] == "assumed"
    assert norm["zone"]["roni"]["value"] == 0.0
    assert norm["zone"]["roni"]["season"] is None
    assert norm["zone"]["roni"]["year"] is None
    for sec in norm["sectors"]:
        assert sec["twin_precedent"] is None

    nino = data["scenarios"]["nino"]
    assert nino["zone"]["roni"]["kind"] == "observed"
    assert nino["zone"]["roni"]["season"] is not None
    assert nino["zone"]["roni"]["year"] is not None
    for sec in nino["sectors"]:
        assert sec["twin_precedent"] is not None


def test_predictions_only_pumani_display(pipeline_output):
    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    for sc in ["normal", "nino"]:
        sc_data = data["scenarios"][sc]
        assert sc_data["zone"]["id"] == "pumani"
        assert [s["id"] for s in sc_data["sectors"]] == [f"S{i}" for i in range(1, 14)]


def test_predictions_thresholds_consistent(pipeline_output):
    def expected_level(score):
        return "low" if score < 0.33 else "medium" if score < 0.66 else "high"

    def expected_conf_label(conf):
        return "baja" if conf < 0.4 else "media" if conf <= 0.7 else "alta"

    with open(os.path.join(pipeline_output, "predictions.json"), encoding="utf-8") as f:
        data = json.load(f)
    for sc in ["normal", "nino"]:
        for sec in data["scenarios"][sc]["sectors"]:
            for block in (sec["risk"], sec["recovery"]):
                assert block["level"] == expected_level(block["score"])
                assert block["confidence_label"] == expected_conf_label(block["confidence"])
            rec = sec["recommendation"]
            assert rec["confidence_label"] == expected_conf_label(rec["confidence"])
            assert len(sec["risk"]["drivers"]) == 3


# --- history.json ---

def test_history_series_schema_and_climate_invariant(pipeline_output):
    schema = _load_schema("history.schema.json")
    with open(os.path.join(pipeline_output, "history.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["data_source"] == "mock"
    assert sorted(data["sectors"], key=lambda s: int(s[1:])) == [f"S{i}" for i in range(1, 14)]

    for sid, series in data["sectors"].items():
        sec_obj = {
            "updated_at": data["generated_at"],
            "data_source": data["data_source"],
            "sector_id": sid,
            "from": data["from"],
            "to": data["to"],
            "series": series,
        }
        _validate(sec_obj, schema, f"history/{sid}")

    # Lluvia, temperatura, humedad y RONI deben ser idénticos en todos los sectores
    zone_fields = ("precip_mm", "soil_moisture", "temp_c", "roni")
    reference = [[row[f] for f in zone_fields] for row in next(iter(data["sectors"].values()))]
    for series in data["sectors"].values():
        assert [[row[f] for f in zone_fields] for row in series] == reference


# --- backtest files ---

def test_backtest_schema_and_sectors(pipeline_output):
    schema = _load_schema("backtest.schema.json")
    expected_sids = [f"S{i}" for i in range(1, 14)]
    for ev in ["2015-16", "2023-24", "2020-22"]:
        path = os.path.join(pipeline_output, f"backtest_{ev}.json")
        assert os.path.exists(path), f"backtest_{ev}.json no existe"
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        _validate(data, schema, f"backtest_{ev}.json")
        assert data["data_source"] == "mock"
        assert data["held_out"] is True
        assert [s["sector_id"] for s in data["per_sector"]] == expected_sids


# --- analogs.json ---

def test_analogs_schema(pipeline_output):
    schema = _load_schema("twin_precedent.schema.json")
    with open(os.path.join(pipeline_output, "analogs.json"), encoding="utf-8") as f:
        data = json.load(f)
    assert data["data_source"] == "mock"
    assert len(data["precedents"]) == 26  # 13 sectores * 2 eventos
    for i, prec in enumerate(data["precedents"]):
        _validate(prec, schema, f"analogs.json[{i}]")
        assert prec["is_simulated"] is True


# --- Reglas de datos faltantes, data_source y protección de sobrescritura ---

def test_detect_data_source():
    from ml.export.export import _detect_data_source

    assert _detect_data_source("ml/data/interim") == "real"
    assert _detect_data_source("ml/data/interim/") == "real"
    assert _detect_data_source("ml/data/fake") == "mock"


def test_missing_ndvi_becomes_null_not_nan(pipeline_output):
    """Si falta un dato de NDVI en monthly.csv, history.json exporta null (no NaN ni valor inventado)."""
    from ml.export.export import build_history

    with tempfile.TemporaryDirectory() as tmpdir:
        mdf = pd.read_csv(os.path.join(FAKE_INPUT, "monthly.csv"))
        # Dejar vacío el primer NDVI de pumani S1
        mask = (mdf["zone_id"] == "pumani") & (mdf["sector_id"] == "S1") & (mdf["date"] == "2000-01")
        mdf.loc[mask, "ndvi"] = None
        mdf.to_csv(os.path.join(tmpdir, "monthly.csv"), index=False)

        with open(os.path.join(FAKE_INPUT, "sectors.geojson"), "r", encoding="utf-8") as f:
            gj = f.read()
        with open(os.path.join(tmpdir, "sectors.geojson"), "w", encoding="utf-8") as f:
            f.write(gj)

        out = build_history(tmpdir, tmpdir, "mock")
        assert out["sectors"]["S1"][0]["ndvi"] is None


def test_validation_failure_does_not_overwrite():
    """Si un JSON falla validación contra schema, lanza excepción sin sobrescribir el archivo previo."""
    from ml.export.export import _load_schema, _validate, _write_json_safe

    with tempfile.TemporaryDirectory() as tmpdir:
        target = os.path.join(tmpdir, "backtest_2015-16.json")
        sentinel = {"sentinel": "do_not_overwrite"}
        _write_json_safe(sentinel, target)

        schema = _load_schema("backtest.schema.json")
        invalid_payload = {"event": "INVALID_EVENT"}
        with pytest.raises(ValueError):
            _validate(invalid_payload, schema, "test_invalid")
            _write_json_safe(invalid_payload, target)

        with open(target, "r", encoding="utf-8") as f:
            assert json.load(f) == sentinel
