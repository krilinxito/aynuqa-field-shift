"""Herramientas internas del chat.

El modelo solo explica lo que devuelven estas cinco funciones. Back no calcula
predicciones, anomalías, correlaciones ni similitudes: lee SQLite y el
simulador de sensores.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Callable

from google.genai import types

from app.errors import ApiError
from app.utils import confidence_label

if TYPE_CHECKING:
    from app.context import AppContext


@dataclass
class SourceTracker:
    entries: dict[tuple[str, str | None], set[str]] = field(default_factory=dict)
    confidences: list[float] = field(default_factory=list)
    notes: set[str] = field(default_factory=set)

    def record(self, tool: str, sector_id: str | None, fields: list[str]) -> None:
        key = (tool, sector_id)
        self.entries.setdefault(key, set()).update(fields)

    def add_confidence(self, value: float | None) -> None:
        if value is None:
            return
        self.confidences.append(max(0.0, min(1.0, float(value))))

    def note(self, text: str) -> None:
        self.notes.add(text)

    def sources(self) -> list[dict[str, Any]]:
        return [
            {
                "tool": tool,
                "sector_id": sector_id,
                "fields": sorted(fields),
            }
            for (tool, sector_id), fields in self.entries.items()
        ]

    def confidence_note(self) -> str:
        if self.confidences:
            label = confidence_label(min(self.confidences))
            message = f"Confianza {label}."
        else:
            message = "No se consultaron datos con nivel de confianza."
        if self.notes:
            message += " " + " ".join(sorted(self.notes))
        return message


class ToolRegistry:
    def __init__(self, ctx: "AppContext", tracker: SourceTracker) -> None:
        self.ctx = ctx
        self.tracker = tracker

    def execute(self, name: str, args: dict[str, Any] | None) -> dict[str, Any]:
        arguments = dict(args or {})
        if name == "get_history":
            if "from" in arguments and "from_date" not in arguments:
                arguments["from_date"] = arguments.pop("from")
            if "to" in arguments and "to_date" not in arguments:
                arguments["to_date"] = arguments.pop("to")
        handlers: dict[str, Callable[..., dict[str, Any]]] = {
            "get_sector": self._get_sector,
            "compare_scenarios": self._compare_scenarios,
            "get_history": self._get_history,
            "get_sensors": self._get_sensors,
            "get_twin_precedent": self._get_twin_precedent,
        }
        handler = handlers.get(name)
        if handler is None:
            return {
                "error": "herramienta_desconocida",
                "message": "No tengo ese dato.",
            }
        try:
            return handler(**arguments)
        except TypeError as exc:
            return {
                "error": "argumentos_invalidos",
                "message": f"No tengo ese dato. ({exc})",
            }
        except ApiError as exc:
            return {"error": exc.code, "message": exc.message}

    def _get_sector(self, sector_id: str, scenario: str = "nino") -> dict[str, Any]:
        if scenario not in ("normal", "nino"):
            return {"error": "invalid_request", "message": "Escenario inválido."}
        payload = self.ctx.db.get_predictions(scenario)
        if not payload:
            return {"found": False, "message": "No tengo ese dato."}
        sector = next(
            (item for item in payload.get("sectors", []) if item.get("id") == sector_id),
            None,
        )
        if sector is None:
            return {"found": False, "message": "No tengo ese dato."}
        self.tracker.record(
            "get_sector",
            sector_id,
            ["risk", "recovery", "recommendation", "confidence"],
        )
        for block in (
            sector.get("risk", {}),
            sector.get("recovery", {}),
            sector.get("recommendation", {}),
        ):
            self.tracker.add_confidence(block.get("confidence"))
        if sector.get("is_simulated"):
            self.tracker.note(
                "Los límites del sector y los años de descanso son simulados."
            )
        return {
            "found": True,
            "sector_id": sector_id,
            "scenario": scenario,
            "data_source": payload.get("data_source"),
            "risk": sector.get("risk"),
            "recovery": sector.get("recovery"),
            "recommendation": sector.get("recommendation"),
            "twin_precedent": sector.get("twin_precedent"),
            "is_simulated": sector.get("is_simulated"),
        }

    def _compare_scenarios(self, sector_id: str) -> dict[str, Any]:
        result: dict[str, Any] = {"found": True, "sector_id": sector_id}
        for scenario in ("normal", "nino"):
            payload = self.ctx.db.get_predictions(scenario)
            if not payload:
                return {"found": False, "message": "No tengo ese dato."}
            sector = next(
                (
                    item
                    for item in payload.get("sectors", [])
                    if item.get("id") == sector_id
                ),
                None,
            )
            if sector is None:
                return {"found": False, "message": "No tengo ese dato."}
            result[scenario] = {
                "risk": sector.get("risk"),
                "recovery": sector.get("recovery"),
                "recommendation": sector.get("recommendation"),
                "is_simulated": sector.get("is_simulated"),
            }
            for block in (
                sector.get("risk", {}),
                sector.get("recovery", {}),
                sector.get("recommendation", {}),
            ):
                self.tracker.add_confidence(block.get("confidence"))
        self.tracker.record(
            "compare_scenarios",
            sector_id,
            ["risk", "recovery", "recommendation", "confidence"],
        )
        self.tracker.note(
            "Los límites del sector y los años de descanso son simulados."
        )
        result["data_source"] = self.ctx.db.get_meta()["sources"]
        return result

    def _get_history(
        self,
        sector_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:
        if not self.ctx.db.sector_exists(sector_id):
            return {"found": False, "message": "No tengo ese dato."}
        if from_date is None and to_date is None:
            series = self.ctx.db.get_history_tail(sector_id, 12)
            actual_from = series[0]["date"] if series else None
            actual_to = series[-1]["date"] if series else None
            data_source = self.ctx.db.get_meta()["sources"]["history"]
        else:
            result = self.ctx.history.get(sector_id, from_date, to_date)
            series = result["series"]
            actual_from = result["from"]
            actual_to = result["to"]
            data_source = result["data_source"]
        self.tracker.record(
            "get_history",
            sector_id,
            ["ndvi", "precip_mm", "soil_moisture", "temp_c", "roni"],
        )
        return {
            "found": True,
            "sector_id": sector_id,
            "from": actual_from,
            "to": actual_to,
            "data_source": data_source,
            "series": series,
        }

    def _get_sensors(self, sector_id: str, hours: int = 48) -> dict[str, Any]:
        if not self.ctx.db.sector_exists(sector_id):
            return {"found": False, "message": "No tengo ese dato."}
        try:
            hours = int(hours)
        except (TypeError, ValueError):
            hours = 48
        hours = max(1, min(48, hours))
        data = self.ctx.sensors.generate(sector_id, hours)
        self.tracker.record("get_sensors", sector_id, ["readings"])
        self.tracker.note("Los sensores son simulados.")
        data["found"] = True
        return data

    def _get_twin_precedent(
        self, sector_id: str, scenario: str = "nino"
    ) -> dict[str, Any]:
        if scenario != "nino":
            self.tracker.record(
                "get_twin_precedent",
                sector_id,
                ["twin_zone", "similarity", "event", "observed_ndvi_anomaly"],
            )
            return {
                "found": False,
                "message": "En el escenario normal no hay precedente de El Niño.",
            }
        precedent = self.ctx.db.get_best_analog(sector_id)
        if precedent is None:
            return {"found": False, "message": "No tengo ese dato."}
        self.tracker.record(
            "get_twin_precedent",
            sector_id,
            ["twin_zone", "similarity", "event", "observed_ndvi_anomaly"],
        )
        self.tracker.add_confidence(precedent.get("confidence"))
        self.tracker.note("El precedente es un precedente, no una garantía.")
        result = dict(precedent)
        result["found"] = True
        result["data_source"] = self.ctx.db.get_meta()["sources"]["analogs"]
        return result


def tool_declarations() -> list[types.FunctionDeclaration]:
    return [
        types.FunctionDeclaration(
            name="get_sector",
            description=(
                "Devuelve el riesgo, la recuperación y la recomendación de un "
                "sector en un escenario. Usa solo los valores devueltos."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "sector_id": {
                        "type": "string",
                        "pattern": "^S\\d+$",
                        "description": "Identificador del sector, por ejemplo S3.",
                    },
                    "scenario": {
                        "type": "string",
                        "enum": ["normal", "nino"],
                        "description": "nino es el estado real de hoy; normal es la comparación.",
                    },
                },
                "required": ["sector_id", "scenario"],
            },
        ),
        types.FunctionDeclaration(
            name="compare_scenarios",
            description=(
                "Compara el mismo sector en el escenario normal y en el "
                "escenario El Niño."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "sector_id": {"type": "string", "pattern": "^S\\d+$"},
                },
                "required": ["sector_id"],
            },
        ),
        types.FunctionDeclaration(
            name="get_history",
            description=(
                "Devuelve la serie mensual de un sector: NDVI, lluvia, humedad "
                "de suelo, temperatura y RONI. Si no se dan fechas, devuelve "
                "los últimos 12 meses."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "sector_id": {"type": "string", "pattern": "^S\\d+$"},
                    "from_date": {
                        "type": "string",
                        "description": "Mes inicial en formato YYYY-MM.",
                    },
                    "to_date": {
                        "type": "string",
                        "description": "Mes final en formato YYYY-MM.",
                    },
                },
                "required": ["sector_id"],
            },
        ),
        types.FunctionDeclaration(
            name="get_sensors",
            description=(
                "Devuelve lecturas simuladas de los sensores del sector, cada "
                "30 minutos, con alertas de helada y estrés hídrico. Máximo 48 horas."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "sector_id": {"type": "string", "pattern": "^S\\d+$"},
                    "hours": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 48,
                        "description": "Horas hacia atrás. Por defecto 48.",
                    },
                },
                "required": ["sector_id"],
            },
        ),
        types.FunctionDeclaration(
            name="get_twin_precedent",
            description=(
                "Devuelve el precedente histórico de la tierra gemela de un "
                "sector durante un El Niño pasado. Solo aplica al escenario nino."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "sector_id": {"type": "string", "pattern": "^S\\d+$"},
                    "scenario": {
                        "type": "string",
                        "enum": ["normal", "nino"],
                    },
                },
                "required": ["sector_id", "scenario"],
            },
        ),
    ]
