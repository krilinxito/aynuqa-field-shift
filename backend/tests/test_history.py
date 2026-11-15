from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import assert_schema


def test_history_full_series(client: TestClient) -> None:
    response = client.get("/api/sectors/S1/history")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "history")
    assert data["sector_id"] == "S1"
    assert data["data_source"] == "mock"
    assert data["from"] == "2000-01"
    assert data["to"] == "2026-10"
    assert len(data["series"]) == 322


def test_history_filters_by_month(client: TestClient) -> None:
    response = client.get("/api/sectors/S1/history?from=2015-01&to=2015-12")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "history")
    assert data["from"] == "2015-01"
    assert data["to"] == "2015-12"
    assert len(data["series"]) == 12
    assert data["series"][0]["date"] == "2015-01"
    assert data["series"][-1]["date"] == "2015-12"


def test_history_unknown_sector(client: TestClient) -> None:
    response = client.get("/api/sectors/S99/history")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "sector_not_found"


def test_history_invalid_month(client: TestClient) -> None:
    response = client.get("/api/sectors/S1/history?from=2015-13")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"


def test_history_range_is_reversed(client: TestClient) -> None:
    response = client.get("/api/sectors/S1/history?from=2016-01&to=2015-01")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"


def test_history_ends_at_last_ml_month(client: TestClient) -> None:
    # La historia termina en el último mes exportado por ML; Back no agrega meses de otra fuente.
    data = client.get("/api/sectors/S1/history").json()
    assert data["series"][-1]["date"] == data["to"] == "2026-10"
