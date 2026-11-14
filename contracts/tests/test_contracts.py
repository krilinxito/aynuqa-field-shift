"""Valida los ejemplos de contracts/ contra sus schemas.

Uso, desde la raiz del repo:
    pip install -r contracts/requirements.txt
    pytest contracts
"""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "examples" / "api"
ML = ROOT / "examples" / "ml_outputs"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def schema(name: str) -> dict:
    return load(ROOT / f"{name}.schema.json")


def check(instance, schema_name: str) -> None:
    validator = Draft202012Validator(schema(schema_name))
    errors = [f"{'/'.join(map(str, e.absolute_path))}: {e.message}" for e in validator.iter_errors(instance)]
    assert not errors, "\n".join(errors[:10])


def test_schemas_are_valid():
    for path in ROOT.glob("*.schema.json"):
        Draft202012Validator.check_schema(load(path))


@pytest.mark.parametrize(
    "example, schema_name",
    [
        ("sectors_normal.json", "sector_risk"),
        ("sectors_nino.json", "sector_risk"),
        ("history_S1.json", "history"),
        ("sensors_S1.json", "sensors"),
        ("backtest_2015-16.json", "backtest"),
        ("twin_precedent.json", "twin_precedent"),
        ("chat_request.json", "chat_request"),
        ("chat_response.json", "chat_response"),
        ("health.json", "health"),
        ("error.json", "error"),
    ],
)
def test_api_examples(example, schema_name):
    check(load(API / example), schema_name)


def test_ml_predictions():
    data = load(ML / "predictions.json")
    assert set(data) == {"generated_at", "scenarios"}
    assert set(data["scenarios"]) == {"normal", "nino"}
    for name, response in data["scenarios"].items():
        check(response, "sector_risk")
        assert response["scenario"] == name


def test_ml_history():
    data = load(ML / "history.json")
    assert set(data) == {"generated_at", "data_source", "from", "to", "sectors"}
    for sector_id, series in data["sectors"].items():
        response = {
            "updated_at": data["generated_at"],
            "data_source": data["data_source"],
            "sector_id": sector_id,
            "from": data["from"],
            "to": data["to"],
            "series": series,
        }
        check(response, "history")


@pytest.mark.parametrize("event", ["2015-16", "2023-24", "2020-22"])
def test_ml_backtest(event):
    data = load(ML / f"backtest_{event}.json")
    check(data, "backtest")
    assert data["event"] == event


def test_ml_analogs():
    data = load(ML / "analogs.json")
    assert set(data) == {"generated_at", "data_source", "precedents"}
    for precedent in data["precedents"]:
        check(precedent, "twin_precedent")


def test_twin_precedent_definition_is_not_duplicated_by_hand():
    """El precedente aparece en dos schemas: deben ser identicos."""
    standalone = {k: v for k, v in schema("twin_precedent").items() if k not in ("$schema", "title")}
    assert schema("sector_risk")["$defs"]["twin_precedent"] == standalone


def test_sector_ids_are_consistent():
    expected = [s["id"] for s in load(API / "sectors_normal.json")["sectors"]]
    assert len(expected) == 13
    assert [s["id"] for s in load(API / "sectors_nino.json")["sectors"]] == expected
    assert sorted(load(ML / "history.json")["sectors"]) == sorted(expected)
    assert {p["sector_id"] for p in load(ML / "analogs.json")["precedents"]} == set(expected)
    for event in ("2015-16", "2023-24", "2020-22"):
        assert [s["sector_id"] for s in load(ML / f"backtest_{event}.json")["per_sector"]] == expected


def test_levels_and_labels_follow_the_thresholds():
    def level(score):
        return "low" if score < 0.33 else "medium" if score < 0.66 else "high"

    def label(confidence):
        return "baja" if confidence < 0.4 else "media" if confidence <= 0.7 else "alta"

    for name in ("sectors_normal.json", "sectors_nino.json"):
        for sector in load(API / name)["sectors"]:
            for block in (sector["risk"], sector["recovery"]):
                assert block["level"] == level(block["score"])
                assert block["confidence_label"] == label(block["confidence"])
            rec = sector["recommendation"]
            assert rec["confidence_label"] == label(rec["confidence"])


def test_climate_is_the_same_for_every_sector():
    """Lluvia, temperatura, humedad y RONI son de la zona: no cambian entre sectores."""
    sectors = load(ML / "history.json")["sectors"]
    zone_fields = ("precip_mm", "soil_moisture", "temp_c", "roni")
    reference = [[row[f] for f in zone_fields] for row in next(iter(sectors.values()))]
    for series in sectors.values():
        assert [[row[f] for f in zone_fields] for row in series] == reference
