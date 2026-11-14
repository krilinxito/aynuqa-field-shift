"""Modelos de entrada de la API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=1000)
    sector_id: str | None = Field(default=None, pattern=r"^S\d+$")
    scenario: Literal["normal", "nino"] | None = None
