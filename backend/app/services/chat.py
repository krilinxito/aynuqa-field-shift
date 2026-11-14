"""Asistente stateless con Gemini y cinco herramientas."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from google import genai
from google.genai import types

from app.errors import ApiError
from app.prompts import SYSTEM_PROMPT
from app.services.tools import SourceTracker, ToolRegistry, tool_declarations
from app.utils import iso_now, now_bolivia

if TYPE_CHECKING:
    from app.context import AppContext

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5
MAX_GENERATIONS = 12


class ChatService:
    def __init__(self, ctx: "AppContext", llm: Any | None = None) -> None:
        self.ctx = ctx
        self._client = llm

    def answer(
        self,
        message: str,
        sector_id: str | None = None,
        scenario: str | None = None,
    ) -> dict[str, Any]:
        tracker = SourceTracker()
        registry = ToolRegistry(self.ctx, tracker)
        selected_scenario = scenario or "nino"
        sectors = self.ctx.db.sector_ids()
        context = (
            "Contexto de la consulta:\n"
            f"- Fecha: {now_bolivia().date().isoformat()}\n"
            f"- Sector indicado: {sector_id or 'no indicado'}\n"
            f"- Escenario: {selected_scenario}\n"
            f"- Sectores válidos: {', '.join(sectors) if sectors else 'no hay datos'}\n"
            "\nPregunta de la asamblea:\n"
            f"{message}"
        )
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=context)],
            )
        ]
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[types.Tool(function_declarations=tool_declarations())],
            temperature=0.2,
            max_output_tokens=1024,
        )

        tool_rounds = 0
        for _ in range(MAX_GENERATIONS):
            response = self._generate(contents, config)
            calls = list(response.function_calls or [])
            if not calls:
                answer = (getattr(response, "text", None) or "").strip()
                return self._result(answer or "No tengo ese dato.", tracker)
            if tool_rounds >= MAX_TOOL_ROUNDS:
                return self._result("No tengo ese dato.", tracker)

            if getattr(response, "candidates", None):
                content = response.candidates[0].content
                if content is not None:
                    contents.append(content)

            parts: list[types.Part] = []
            for call in calls:
                result = registry.execute(call.name, call.args)
                parts.append(
                    types.Part.from_function_response(
                        name=call.name,
                        response={"result": result},
                    )
                )
            contents.append(types.Content(role="user", parts=parts))
            tool_rounds += 1

        return self._result("No tengo ese dato.", tracker)

    def _generate(
        self,
        contents: list[types.Content],
        config: types.GenerateContentConfig,
    ) -> types.GenerateContentResponse:
        model = self.ctx.settings.llm_model
        if not model:
            raise ApiError(
                502,
                "llm_unavailable",
                "El asistente no está configurado. Falta LLM_MODEL.",
            )
        if self._client is None:
            if not self.ctx.settings.llm_api_key:
                raise ApiError(
                    502,
                    "llm_unavailable",
                    "El asistente no está configurado. Falta LLM_API_KEY.",
                )
            self._client = genai.Client(api_key=self.ctx.settings.llm_api_key)
        try:
            return self._client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
        except ApiError:
            raise
        except Exception as exc:  # noqa: BLE001 - cuota, red o proveedor
            logger.exception("Error del modelo de lenguaje")
            raise ApiError(
                502,
                "llm_unavailable",
                "El asistente no está disponible en este momento. Intenta de nuevo.",
            ) from exc

    def _result(self, answer: str, tracker: SourceTracker) -> dict[str, Any]:
        return {
            "answer": answer,
            "sources": tracker.sources(),
            "confidence_note": tracker.confidence_note(),
            "updated_at": iso_now(),
        }
