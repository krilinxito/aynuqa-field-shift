from __future__ import annotations

import shutil
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from tests.conftest import CONTRACTS_DIR, assert_schema


def test_health_is_mock_without_ml_outputs(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "health")
    assert data["sources"] == {
        "predictions": "mock",
        "history": "mock",
        "backtest": "mock",
        "analogs": "mock",
    }


def test_reload_requires_token(client: TestClient) -> None:
    response = client.post("/api/admin/reload")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"

    response = client.post(
        "/api/admin/reload", headers={"X-Admin-Token": "incorrecto"}
    )
    assert response.status_code == 401


def test_reload_with_token(client: TestClient) -> None:
    response = client.post(
        "/api/admin/reload", headers={"X-Admin-Token": "test-token"}
    )
    assert response.status_code == 200
    assert_schema(response.json(), "health")


def test_reload_rejects_when_admin_token_is_empty(tmp_path: Path) -> None:
    settings = Settings(
        database_path=str(tmp_path / "app.db"),
        ml_outputs_dir=str(tmp_path / "ml_outputs"),
        contracts_dir=str(CONTRACTS_DIR),
        admin_token="",
    )
    with TestClient(create_app(settings)) as client:
        response = client.post(
            "/api/admin/reload", headers={"X-Admin-Token": "cualquiera"}
        )
    assert response.status_code == 401


def test_real_files_are_loaded_when_present(tmp_path: Path) -> None:
    outputs = tmp_path / "ml_outputs"
    outputs.mkdir()
    examples = CONTRACTS_DIR / "examples" / "ml_outputs"
    for source in examples.glob("*.json"):
        shutil.copy(source, outputs / source.name)

    settings = Settings(
        database_path=str(tmp_path / "app.db"),
        ml_outputs_dir=str(outputs),
        contracts_dir=str(CONTRACTS_DIR),
        admin_token="test-token",
    )
    with TestClient(create_app(settings)) as client:
        health = client.get("/health").json()
        assert health["sources"] == {
            "predictions": "real",
            "history": "real",
            "backtest": "real",
            "analogs": "real",
        }
        sectors = client.get("/api/sectors?scenario=nino").json()
        assert sectors["data_source"] == "real"
        history = client.get("/api/sectors/S1/history").json()
        assert history["data_source"] == "real"
        backtest = client.get("/api/backtest?event=2015-16").json()
        assert backtest["data_source"] == "real"
        assert_schema(sectors, "sector_risk")
        assert_schema(history, "history")
        assert_schema(backtest, "backtest")


def test_invalid_real_file_falls_back_to_mock(tmp_path: Path) -> None:
    outputs = tmp_path / "ml_outputs"
    outputs.mkdir()
    examples = CONTRACTS_DIR / "examples" / "ml_outputs"
    for source in examples.glob("*.json"):
        shutil.copy(source, outputs / source.name)
    (outputs / "predictions.json").write_text("{ no es json", encoding="utf-8")

    settings = Settings(
        database_path=str(tmp_path / "app.db"),
        ml_outputs_dir=str(outputs),
        contracts_dir=str(CONTRACTS_DIR),
        admin_token="test-token",
    )
    with TestClient(create_app(settings)) as client:
        health = client.get("/health").json()
        assert health["sources"]["predictions"] == "mock"
        assert health["sources"]["history"] == "real"
        sectors = client.get("/api/sectors?scenario=nino").json()
        assert sectors["data_source"] == "mock"
        assert_schema(sectors, "sector_risk")
