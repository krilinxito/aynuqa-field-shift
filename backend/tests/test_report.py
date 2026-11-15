from __future__ import annotations

from fastapi.testclient import TestClient


def test_report_markdown(client: TestClient) -> None:
    response = client.get("/api/report?scenario=nino")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/markdown")
    text = response.text
    assert "# Reporte para la asamblea" in text
    assert "## Clima de la zona" in text
    assert "## Sectores para cultivar" in text
    assert "## Nota de honestidad" in text
    assert "El Niño aumenta la probabilidad de sequía; no la asegura." in text


def test_report_html(client: TestClient) -> None:
    response = client.get("/api/report?scenario=normal&format=html")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    text = response.text
    assert "<!doctype html>" in text
    assert "<h1>Reporte para la asamblea" in text
    assert "Año normal" in text


def test_report_invalid_format(client: TestClient) -> None:
    response = client.get("/api/report?format=pdf")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
