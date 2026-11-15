from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient
from google.genai import types

from app.services.chat import ChatService
from app.services.tools import SourceTracker, ToolRegistry
from tests.conftest import assert_schema


class FakeCall:
    def __init__(self, name: str, args: dict) -> None:
        self.name = name
        self.args = args


class FakeResponse:
    def __init__(
        self,
        text: str | None = None,
        calls: list[FakeCall] | None = None,
        content: types.Content | None = None,
    ) -> None:
        self.text = text
        self.function_calls = calls or []
        self.candidates = [SimpleNamespace(content=content)] if content else []


class FakeModels:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self.responses = iter(responses)

    def generate_content(self, **kwargs):
        return next(self.responses)


class FakeClient:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self.models = FakeModels(responses)


def test_chat_without_llm_config_returns_502(client: TestClient) -> None:
    response = client.post(
        "/api/chat",
        json={"message": "¿Conviene abrir el sector 3?", "sector_id": "S3"},
    )
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "llm_unavailable"


def test_chat_success_with_function_call(client: TestClient, ctx) -> None:
    call_content = types.Content(
        role="model",
        parts=[
            types.Part.from_function_call(
                name="get_sector",
                args={"sector_id": "S3", "scenario": "nino"},
            )
        ],
    )
    answer = (
        "El sistema recomienda abrir el sector 3. "
        "La confianza es media."
    )
    answer_content = types.Content(
        role="model", parts=[types.Part.from_text(text=answer)]
    )
    fake = FakeClient(
        [
            FakeResponse(
                calls=[FakeCall("get_sector", {"sector_id": "S3", "scenario": "nino"})],
                content=call_content,
            ),
            FakeResponse(text=answer, content=answer_content),
        ]
    )
    ctx.chat = ChatService(ctx, llm=fake)

    response = client.post(
        "/api/chat",
        json={
            "message": "¿Conviene abrir el sector 3?",
            "sector_id": "S3",
            "scenario": "nino",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert_schema(data, "chat_response")
    assert data["answer"] == answer
    assert data["sources"][0]["tool"] == "get_sector"
    assert data["sources"][0]["sector_id"] == "S3"
    assert "Confianza" in data["confidence_note"]


def test_chat_stops_after_five_tool_rounds(client: TestClient, ctx) -> None:
    responses = []
    for _ in range(6):
        content = types.Content(
            role="model",
            parts=[
                types.Part.from_function_call(
                    name="get_sector",
                    args={"sector_id": "S3", "scenario": "nino"},
                )
            ],
        )
        responses.append(
            FakeResponse(
                calls=[FakeCall("get_sector", {"sector_id": "S3", "scenario": "nino"})],
                content=content,
            )
        )
    ctx.chat = ChatService(ctx, llm=FakeClient(responses))
    response = client.post(
        "/api/chat",
        json={"message": "Dime el sector", "sector_id": "S3"},
    )
    assert response.status_code == 200
    assert response.json()["answer"] == "No tengo ese dato."


def test_chat_invalid_body(client: TestClient) -> None:
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"

    response = client.post(
        "/api/chat", json={"message": "hola", "campo_extra": 1}
    )
    assert response.status_code == 422


def test_chat_unknown_sector(client: TestClient) -> None:
    response = client.post(
        "/api/chat",
        json={"message": "Hola", "sector_id": "S99"},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "sector_not_found"


def test_tools_read_from_sqlite(client: TestClient, ctx) -> None:
    tracker = SourceTracker()
    registry = ToolRegistry(ctx, tracker)

    sector = registry.execute(
        "get_sector", {"sector_id": "S3", "scenario": "nino"}
    )
    assert sector["found"] is True
    assert "risk" in sector
    assert "recommendation" in sector

    comparison = registry.execute("compare_scenarios", {"sector_id": "S3"})
    assert comparison["found"] is True
    assert comparison["normal"]["risk"] is not None
    assert comparison["nino"]["risk"] is not None

    history = registry.execute("get_history", {"sector_id": "S3"})
    assert history["found"] is True
    assert len(history["series"]) == 12

    sensors = registry.execute(
        "get_sensors", {"sector_id": "S1", "hours": 48}
    )
    assert sensors["found"] is True
    assert len(sensors["readings"]) == 97

    twin = registry.execute(
        "get_twin_precedent", {"sector_id": "S3", "scenario": "nino"}
    )
    assert twin["found"] is True
    assert twin["twin_zone"]

    normal_twin = registry.execute(
        "get_twin_precedent", {"sector_id": "S3", "scenario": "normal"}
    )
    assert normal_twin["found"] is False
    assert len(tracker.sources()) == 5


def test_chat_openapi_documents_tool_calling(client: TestClient) -> None:
    schema = client.get("/openapi.json").json()
    operation = schema["paths"]["/api/chat"]["post"]

    assert operation["summary"] == "Chat de la asamblea con tool calling"
    for tool in (
        "get_sector",
        "compare_scenarios",
        "get_history",
        "get_sensors",
        "get_twin_precedent",
    ):
        assert tool in operation["description"]

    success = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert success["$ref"] == "#/components/schemas/ChatResponse"

    for status in ("404", "422", "502"):
        response = operation["responses"][status]
        assert response["content"]["application/json"]["schema"]["$ref"] == (
            "#/components/schemas/ErrorResponse"
        )

    components = schema["components"]["schemas"]
    assert set(components["ChatResponse"]["properties"]) == {
        "answer",
        "sources",
        "confidence_note",
        "updated_at",
    }
    assert set(components["ChatSource"]["properties"]) == {
        "tool",
        "sector_id",
        "fields",
    }
    assert components["ChatSource"]["properties"]["tool"]["enum"] == [
        "get_sector",
        "compare_scenarios",
        "get_history",
        "get_sensors",
        "get_twin_precedent",
    ]
