from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from app.utils import current_month
from tests.conftest import assert_schema


class FakePower:
    def get_daily(self, start: date, end: date) -> list[dict]:
        return [
            {
                "date": "2026-11-01",
                "T2M": 10.0,
                "PRECTOTCORR": 2.0,
                "GWETROOT": 0.4,
                "ALLSKY_SFC_SW_DWN": 20.0,
            },
            {
                "date": "2026-11-02",
                "T2M": 12.0,
                "PRECTOTCORR": 3.0,
                "GWETROOT": 0.42,
                "ALLSKY_SFC_SW_DWN": 21.0,
            },
        ]


def _mark_history_real(ctx) -> None:
    connection = ctx.db.connect()
    try:
        with connection:
            connection.execute(
                "UPDATE history_meta SET data_source = 'real' WHERE id = 1"
            )
    finally:
        connection.close()


def test_history_is_extended_with_current_month_from_power(
    client: TestClient, ctx
) -> None:
    _mark_history_real(ctx)
    ctx.power = FakePower()

    response = client.get("/api/sectors/S1/history")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "history")
    assert data["data_source"] == "real"
    assert data["series"][-1]["date"] == current_month()
    assert data["series"][-1]["precip_mm"] == 5.0
    assert data["series"][-1]["soil_moisture"] == 0.41
    assert data["series"][-1]["temp_c"] == 11.0
    assert data["series"][-1]["ndvi"] is None
    assert data["series"][-1]["roni"] is None


def test_history_does_not_extend_past_range(client: TestClient, ctx) -> None:
    _mark_history_real(ctx)
    ctx.power = FakePower()
    response = client.get("/api/sectors/S1/history?to=2026-10")
    assert response.status_code == 200
    assert response.json()["series"][-1]["date"] == "2026-10"
