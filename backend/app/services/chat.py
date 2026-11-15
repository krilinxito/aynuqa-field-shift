"""Asistente stateless con Gemini y cinco herramientas."""

from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING, Any

from google import genai
from google.genai import types

from app.errors import ApiError
from app.prompts import SYSTEM_PROMPT
from app.services.bert_translator import BertIndigenousPipeline
from app.services.tools import SourceTracker, ToolRegistry, tool_declarations
from app.utils import iso_now, now_bolivia

if TYPE_CHECKING:
    from app.context import AppContext

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5
MAX_GENERATIONS = 12

FALLBACK_FLASH_MODELS = (
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash-lite",
)

LEVEL_ES = {
    "low": "bajo",
    "medium": "moderado",
    "high": "alto",
}

RECOVERY_ES = {
    "low": "le falta descansar más",
    "medium": "se está recuperando a medias",
    "high": "ya descansó bien y tiene buena fuerza",
}


def _greenness_words(anomaly: float | None) -> str:
    if anomaly is None:
        return "sin dato de verdor"
    if anomaly <= -1.5:
        return "el verdor del campo bajó mucho"
    if anomaly <= -0.5:
        return "el verdor del campo estuvo más bajo de lo normal"
    if anomaly < 0.5:
        return "el verdor del campo se mantuvo cerca de lo normal"
    return "el verdor del campo estuvo mejor de lo normal"


ADVANCED_INSTRUCTION = (
    "\nMODO AVANZADO: la persona pidió detalles técnicos. Puedes usar los números "
    "exactos que devuelven las herramientas (puntaje de riesgo de 0 a 1 con su "
    "intervalo, confianza, NDVI y su anomalía, residuo RESTREND, RONI, factores con "
    "su peso) y nombrarlos. Hasta 90 palabras. No inventes ni calcules números que "
    "las herramientas no den, y di siempre la confianza."
)


def extract_mode_tag(message: str) -> tuple[bool, str]:
    """Quita el prefijo opcional [modo:avanzado] que envía el front."""
    match = re.match(r"^\[modo:avanzado\]\s*(.*)$", message, flags=re.DOTALL)
    if match:
        return True, match.group(1)
    return False, message


def _clean_technical_terms(text: str) -> str:
    """Garantiza que no queden siglas técnicas como NDVI o RONI en la respuesta."""
    cleaned = re.sub(r"\bNDVI\b", "verdor del campo", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bRONI\b", "El Niño", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bONI\b", "El Niño", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\banomal[íi]a(?:s)? de verdor del campo\b",
        "cambio en el verdor del campo",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"\banomal[íi]a(?:s)?\b",
        "diferencia con lo normal",
        cleaned,
        flags=re.IGNORECASE,
    )
    return cleaned


class ChatService:
    def __init__(self, ctx: "AppContext", llm: Any | None = None) -> None:
        self.ctx = ctx
        self._client = llm
        self._is_real_client = llm is None

    def _humanize_sector(self, item: dict[str, Any]) -> dict[str, Any]:
        rec = item.get("recommendation", {})
        risk = item.get("risk", {})
        recov = item.get("recovery", {})
        rot = item.get("rotation", {})
        twin = item.get("twin_precedent")
        estado_rot = (
            f"en descanso hace {rot.get('years_in_status')} años"
            if rot.get("status") == "resting"
            else f"en cultivo hace {rot.get('years_in_status')} años"
        )
        twin_summary = None
        if twin:
            twin_summary = (
                f"Tierra parecida en {twin.get('twin_zone')} durante El Niño "
                f"{twin.get('event')}: {_greenness_words(twin.get('observed_ndvi_anomaly'))} "
                "(solo como referencia histórica, no es seguro que se repita)."
            )
        reasons = [
            _clean_technical_terms(str(r)) for r in (rec.get("reasons") or [])
        ]
        return {
            "sector": item.get("name") or item.get("id"),
            "estado_actual": estado_rot,
            "que_conviene_hacer": rec.get("text"),
            "cultivo_sugerido": rec.get("crop"),
            "epoca_siembra": rec.get("sowing_window"),
            "anos_extra_descanso": rec.get("extend_rest_years"),
            "motivos_en_palabras_simples": reasons,
            "riesgo_de_falta_de_lluvia": LEVEL_ES.get(
                risk.get("level", ""), "moderado"
            ),
            "estado_del_suelo": RECOVERY_ES.get(
                recov.get("level", ""), "en recuperación"
            ),
            "seguridad_del_consejo": rec.get("confidence_label"),
            "experiencia_en_tierra_parecida": twin_summary,
        }

    def _preload_context(
        self,
        registry: ToolRegistry,
        sector_id: str | None,
        scenario: str,
    ) -> str:
        """Pre-carga los datos base desde SQLite traducidos a lenguaje humano
        para que el modelo responda rápido, con fluidez y sin jerga técnica."""
        if not self._is_real_client:
            return ""

        payload = self.ctx.db.get_predictions(scenario)
        if not payload or not payload.get("sectors"):
            return ""

        if sector_id:
            registry.execute(
                "get_sector", {"sector_id": sector_id, "scenario": scenario}
            )
            if scenario == "nino":
                registry.execute(
                    "get_twin_precedent",
                    {"sector_id": sector_id, "scenario": scenario},
                )
            sector_item = next(
                (
                    s
                    for s in payload.get("sectors", [])
                    if s.get("id") == sector_id
                ),
                None,
            )
            if not sector_item:
                return ""
            return (
                "\nInformación del sector en palabras simples (úsala para "
                "conversar de forma breve y natural, sin dar números crudos):\n"
                + json.dumps(
                    self._humanize_sector(sector_item), ensure_ascii=False
                )
            )

        human_sectors = []
        for item in payload.get("sectors", []):
            sid = item.get("id")
            if sid:
                registry.execute(
                    "get_sector", {"sector_id": sid, "scenario": scenario}
                )
            human_sectors.append(self._humanize_sector(item))

        zone = payload.get("zone") or {}
        return (
            "\nResumen de la comunidad en palabras simples (responde de forma "
            "breve y conversacional solo a lo que preguntaron, sin volcar toda "
            "la lista de golpe):\n"
            + json.dumps(
                {
                    "comunidad": zone.get("name", "Pumani"),
                    "situacion": (
                        "Año actual con presencia de El Niño"
                        if scenario == "nino"
                        else "Comparación con un año normal sin El Niño"
                    ),
                    "sectores": human_sectors,
                },
                ensure_ascii=False,
            )
        )

    def answer(
        self,
        message: str,
        sector_id: str | None = None,
        scenario: str | None = None,
    ) -> dict[str, Any]:
        tracker = SourceTracker()
        registry = ToolRegistry(self.ctx, tracker)
        pipeline = BertIndigenousPipeline(self.ctx)
        advanced, message = extract_mode_tag(message)
        user_lang, clean_message = pipeline.extract_lang_tag(message)
        selected_scenario = scenario or "nino"
        sectors = self.ctx.db.sector_ids()
        preloaded = self._preload_context(registry, sector_id, selected_scenario)
        lang_instruction = ""
        if user_lang == "ay":
            lang_instruction = (
                "\nIDIOMA DE RESPUESTA OBLIGATORIO: Responde íntegramente en "
                "AYMARA del altiplano boliviano (La Paz / Pumani), con palabras "
                "sencillas y naturales del campo (por ejemplo: yapu, samaraña, "
                "jallu, waña pacha, ch'uqi, jupha)."
            )
        elif user_lang == "qu":
            lang_instruction = (
                "\nIDIOMA DE RESPUESTA OBLIGATORIO: Responde íntegramente en "
                "QUECHUA sureño boliviano (Qhichwa), con palabras sencillas y "
                "naturales del campo (por ejemplo: chakra, samay, para, ch'aki "
                "pacha, papa, kinwa)."
            )
        elif user_lang == "en":
            lang_instruction = (
                "\nIDIOMA DE RESPUESTA OBLIGATORIO: Responde íntegramente en "
                "INGLÉS sencillo y claro (plain English), con frases cortas. "
                "Llama 'field' a cada sector."
            )
        es_bridge = ""
        if user_lang in ("ay", "qu"):
            es_meaning = pipeline.translate(
                clean_message, target_lang="es", source_lang=user_lang
            )
            if es_meaning and es_meaning != clean_message:
                es_bridge = f"\nInterpretación BERT en español: {es_meaning}"

        context = (
            "Contexto de la conversación:\n"
            f"- Fecha: {now_bolivia().date().isoformat()}\n"
            f"- Sector consultado: {sector_id or 'toda la comunidad'}\n"
            f"- Situación: {'El Niño activo' if selected_scenario == 'nino' else 'año normal'}\n"
            f"- Sectores de la comunidad: {', '.join(sectors) if sectors else 'no hay datos'}\n"
            f"{preloaded}"
            f"{lang_instruction}"
            f"{ADVANCED_INSTRUCTION if advanced else ''}\n"
            "\nPregunta de la persona mayor:\n"
            f"{clean_message}{es_bridge}"
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
            temperature=0.35,
            max_output_tokens=500 if advanced else 350,
            thinking_config=(
                types.ThinkingConfig(thinking_budget=0)
                if self._is_real_client
                else None
            ),
        )

        tool_rounds = 0
        for _ in range(MAX_GENERATIONS):
            response = self._generate(contents, config)
            calls = list(response.function_calls or [])
            if not calls:
                raw_answer = (getattr(response, "text", None) or "").strip()
                answer = (
                    _clean_technical_terms(raw_answer)
                    if self._is_real_client and not advanced
                    else raw_answer
                )
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

    def _candidate_models(self, primary: str) -> list[str]:
        if not self._is_real_client:
            return [primary]
        models: list[str] = [primary]
        for fallback in FALLBACK_FLASH_MODELS:
            if fallback not in models:
                models.append(fallback)
        return models

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
            self._client = genai.Client(
                api_key=self.ctx.settings.llm_api_key,
                http_options=types.HttpOptions(
                    timeout=12_000, api_version="v1beta"
                ),
            )
            try:
                self._client._api_client._retry.stop = (  # noqa: SLF001
                    lambda rs: rs.attempt_number >= 1
                )
            except Exception:  # noqa: BLE001
                pass

        last_exc: Exception | None = None
        for candidate_model in self._candidate_models(model):
            try:
                return self._client.models.generate_content(
                    model=candidate_model,
                    contents=contents,
                    config=config,
                )
            except ApiError:
                raise
            except Exception as exc:  # noqa: BLE001 - cuota, 503 o red
                last_exc = exc
                logger.warning(
                    "Modelo %s falló (%s), probando respaldo...",
                    candidate_model,
                    exc,
                )

        logger.exception("Error del modelo de lenguaje", exc_info=last_exc)
        raise ApiError(
            502,
            "llm_unavailable",
            "El asistente no está disponible en este momento. Intenta de nuevo.",
        ) from last_exc

    def _result(self, answer: str, tracker: SourceTracker) -> dict[str, Any]:
        return {
            "answer": answer,
            "sources": tracker.sources(),
            "confidence_note": tracker.confidence_note(),
            "updated_at": iso_now(),
        }
