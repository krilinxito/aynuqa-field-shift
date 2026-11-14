from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from app.config import Settings
from app.main import create_app

REPO_DIR = Path(__file__).resolve().parents[2]
CONTRACTS_DIR = REPO_DIR / "contracts"


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        database_path=str(tmp_path / "app.db"),
        ml_outputs_dir=str(tmp_path / "ml_outputs"),
        contracts_dir=str(CONTRACTS_DIR),
        admin_token="test-token",
        llm_model="fake-model",
        llm_api_key="",
    )


@pytest.fixture
def client(settings: Settings) -> TestClient:
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def ctx(client: TestClient):
    return client.app.state.ctx


def schema(name: str) -> dict:
    return json.loads(
        (CONTRACTS_DIR / f"{name}.schema.json").read_text(encoding="utf-8")
    )


def assert_schema(data: dict, name: str) -> None:
    validator = Draft202012Validator(schema(name))
    errors = [
        f"{'/'.join(map(str, error.absolute_path))}: {error.message}"
        for error in validator.iter_errors(data)
    ]
    assert not errors, "\n".join(errors[:10])
