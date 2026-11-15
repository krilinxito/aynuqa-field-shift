from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import assert_schema


def test_sectors_nino(client: TestClient) -> None:
    response = client.get("/api/sectors?scenario=nino")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "sector_risk")
    assert data["scenario"] == "nino"
    assert data["data_source"] == "mock"
    assert len(data["sectors"]) == 8
    assert all(sector["twin_precedent"] for sector in data["sectors"])


def test_sectors_normal_has_no_twin_precedent(client: TestClient) -> None:
    response = client.get("/api/sectors?scenario=normal")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "sector_risk")
    assert data["scenario"] == "normal"
    assert all(sector["twin_precedent"] is None for sector in data["sectors"])


def test_sectors_default_scenario_is_nino(client: TestClient) -> None:
    response = client.get("/api/sectors")
    assert response.status_code == 200
    assert response.json()["scenario"] == "nino"


def test_sectors_invalid_scenario(client: TestClient) -> None:
    response = client.get("/api/sectors?scenario=quizas")
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "invalid_request"
    assert body["error"]["message"]


def test_unknown_route_uses_error_shape(client: TestClient) -> None:
    response = client.get("/api/no-existe")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_sectors_are_gzipped(client) -> None:
    response = client.get(
        "/api/sectors", params={"scenario": "nino"}, headers={"Accept-Encoding": "gzip"}
    )
    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "gzip"
