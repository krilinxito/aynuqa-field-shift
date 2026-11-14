from __future__ import annotations

from pathlib import Path

import httpx

from app.config import Settings
from app.db import Database
from app.services.nasa_power import NasaPowerClient


def _payload() -> dict:
    return {
        "properties": {
            "parameter": {
                "T2M": {"20261101": 5.0, "20261102": -999.0},
                "PRECTOTCORR": {"20261101": 1.2, "20261102": 0.0},
                "GWETROOT": {"20261101": 0.3, "20261102": 0.31},
                "ALLSKY_SFC_SW_DWN": {"20261101": 20.0, "20261102": 21.0},
            }
        }
    }


def test_power_client_parses_missing_values_and_caches(tmp_path: Path) -> None:
    settings = Settings(
        database_path=str(tmp_path / "app.db"),
        contracts_dir=str(Path(__file__).resolve().parents[2] / "contracts"),
    )
    db = Database(Path(settings.database_path))
    db.initialize()
    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        assert request.url.params["latitude"] == "-17.09"
        assert request.url.params["longitude"] == "-68.0"
        return httpx.Response(200, json=_payload())

    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = NasaPowerClient(settings, db, http_client=http)
    days = client.get_daily("2026-11-01", "2026-11-02")
    assert len(days) == 2
    assert days[0]["T2M"] == 5.0
    assert days[0]["PRECTOTCORR"] == 1.2
    assert days[1]["T2M"] is None
    assert calls["count"] == 1

    again = client.get_daily("2026-11-01", "2026-11-02")
    assert again == days
    assert calls["count"] == 1
    http.close()


def test_power_client_normalizes_positive_latitude(tmp_path: Path) -> None:
    settings = Settings(
        database_path=str(tmp_path / "app.db"),
        contracts_dir=str(Path(__file__).resolve().parents[2] / "contracts"),
    )
    db = Database(Path(settings.database_path))
    db.initialize()
    seen: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.url.params["latitude"])
        return httpx.Response(200, json=_payload())

    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = NasaPowerClient(settings, db, http_client=http)
    client.get_daily("2026-11-01", "2026-11-01", lat=17.09)
    assert seen == ["-17.09"]
    http.close()
