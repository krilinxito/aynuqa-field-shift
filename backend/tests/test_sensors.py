from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from app.services.sensors import SensorSimulator
from app.utils import BOLIVIA_TZ
from tests.conftest import assert_schema


def test_sensors_schema_and_length(client: TestClient) -> None:
    response = client.get("/api/sectors/S1/sensors?hours=48")
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "sensors")
    assert data["hours"] == 48
    assert data["is_simulated"] is True
    assert len(data["readings"]) == 97
    assert all(reading["is_simulated"] is True for reading in data["readings"])


def test_s1_has_frost_event() -> None:
    fixed = datetime(2026, 11, 14, 12, 0, tzinfo=BOLIVIA_TZ)
    data = SensorSimulator().generate("S1", 48, now=fixed)
    frost = [reading for reading in data["readings"] if reading["frost_alert"]]
    assert frost
    assert any(
        reading["ts"].endswith("04:00:00-04:00")
        or reading["ts"].endswith("04:30:00-04:00")
        for reading in frost
    )


def test_s2_has_water_stress_event() -> None:
    fixed = datetime(2026, 11, 14, 12, 0, tzinfo=BOLIVIA_TZ)
    data = SensorSimulator().generate("S2", 48, now=fixed)
    stressed = [
        reading for reading in data["readings"] if reading["water_stress_alert"]
    ]
    assert stressed
    assert any(
        reading["ts"].endswith("12:00:00-04:00") for reading in stressed
    )


def test_sensors_are_deterministic() -> None:
    fixed = datetime(2026, 11, 14, 12, 0, tzinfo=BOLIVIA_TZ)
    simulator = SensorSimulator()
    first = simulator.generate("S3", 48, now=fixed)
    second = simulator.generate("S3", 48, now=fixed)
    assert first == second


def test_sensor_ranges() -> None:
    fixed = datetime(2026, 11, 14, 12, 0, tzinfo=BOLIVIA_TZ)
    data = SensorSimulator().generate("S4", 48, now=fixed)
    for reading in data["readings"]:
        assert -5.0 <= reading["air_temp_c"] <= 16.0
        assert 10.0 <= reading["soil_moisture_pct"] <= 35.0
        assert -1.0 <= reading["canopy_temp_delta_c"] <= 4.0


def test_sensors_unknown_sector(client: TestClient) -> None:
    response = client.get("/api/sectors/S99/sensors")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "sector_not_found"
