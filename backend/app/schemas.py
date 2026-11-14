"""Modelos de entrada y salida de la API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ToolName = Literal[
    "get_sector",
    "compare_scenarios",
    "get_history",
    "get_sensors",
    "get_twin_precedent",
]


class ChatRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "message": "¿Conviene abrir el sector 3 este año?",
                    "sector_id": "S3",
                    "scenario": "nino",
                }
            ]
        },
    )

    message: str = Field(
        min_length=1,
        max_length=1000,
        description="Pregunta de la asamblea en español simple.",
        examples=["¿Conviene abrir el sector 3 este año?"],
    )
    sector_id: str | None = Field(
        default=None,
        pattern=r"^S\d+$",
        description="Sector sobre el que se pregunta. Opcional.",
        examples=["S3"],
    )
    scenario: Literal["normal", "nino"] | None = Field(
        default=None,
        description=(
            "Escenario de la consulta. `nino` es el estado real de hoy; "
            "`normal` es la comparación. Si se omite, Back usa `nino`."
        ),
        examples=["nino"],
    )


class ChatSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool: ToolName = Field(description="Herramienta que aportó los datos.")
    sector_id: str | None = Field(
        default=None,
        pattern=r"^S\d+$",
        description="Sector consultado, o null si la herramienta no usó uno.",
    )
    fields: list[str] = Field(
        description="Campos del resultado que se consultaron.",
        examples=[["risk", "recovery", "recommendation"]],
    )


class ChatResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "answer": (
                        "El sistema recomienda abrir el sector 3. "
                        "La confianza es media."
                    ),
                    "sources": [
                        {
                            "tool": "get_sector",
                            "sector_id": "S3",
                            "fields": ["risk", "recovery", "recommendation"],
                        }
                    ],
                    "confidence_note": (
                        "Confianza media. Los límites del sector y los años "
                        "de descanso son simulados."
                    ),
                    "updated_at": "2026-11-14T12:00:00-04:00",
                }
            ]
        },
    )

    answer: str = Field(
        min_length=1,
        description="Respuesta en español simple, máximo 120 palabras.",
    )
    sources: list[ChatSource] = Field(
        description="Herramientas usadas y campos consultados.",
    )
    confidence_note: str = Field(
        min_length=1,
        description="Confianza mínima usada y notas de honestidad.",
    )
    updated_at: str = Field(
        description="Instante ISO 8601 con hora de Bolivia.",
        examples=["2026-11-14T12:00:00-04:00"],
    )


class ErrorBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(description="Código estable del error.")
    message: str = Field(description="Mensaje en español simple.")


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: ErrorBody
