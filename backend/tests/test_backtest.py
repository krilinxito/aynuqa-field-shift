from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import assert_schema


@pytest.mark.parametrize("event", ["2015-16", "2023-24", "2020-22"])
def test_backtest_events(client: TestClient, event: str) -> None:
    response = client.get(f"/api/backtest?event={event}")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "backtest")
    assert data["event"] == event
    assert data["data_source"] == "mock"


def test_backtest_default_event(client: TestClient) -> None:
    response = client.get("/api/backtest")
    assert response.status_code == 200
    assert response.json()["event"] == "2015-16"


def test_backtest_invalid_event(client: TestClient) -> None:
    response = client.get("/api/backtest?event=2024-25")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"


def test_backtest_missing_event(client: TestClient, ctx) -> None:
    connection = ctx.db.connect()
    try:
        with connection:
            connection.execute("DELETE FROM backtests WHERE event = '2020-22'")
    finally:
        connection.close()
    response = client.get("/api/backtest?event=2020-22")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "event_not_found"
