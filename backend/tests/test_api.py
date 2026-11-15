from pathlib import Path

from app.main import app


def test_routes_are_registered() -> None:
    paths = set(app.openapi()["paths"])
    assert "/api/powersync/token" in paths
    assert "/api/powersync/jwks" in paths
    assert "/api/sectors" in paths


def test_fixture_map_points_to_existing_contracts() -> None:
    contracts = Path(__file__).parents[2] / "contracts"
    assert (contracts / "examples" / "api" / "sectors_nino.json").exists()
