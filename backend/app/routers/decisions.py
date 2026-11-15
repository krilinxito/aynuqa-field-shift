"""Decisiones de la comunidad (contracts/decision.schema.json)."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Body, Depends, Header, Path, Query, Response
from jsonschema import Draft202012Validator, FormatChecker

from app.context import AppContext, get_ctx
from app.errors import ApiError

router = APIRouter(prefix="/api/decisions", tags=["decisions"])

ID_PATTERN = r"^[0-9a-fA-F-]{36}$"


@lru_cache
def _validator(contracts_dir: str) -> Draft202012Validator:
    from pathlib import Path as FsPath  # noqa: PLC0415

    schema = json.loads(
        (FsPath(contracts_dir) / "decision.schema.json").read_text(encoding="utf-8")
    )
    return Draft202012Validator(schema, format_checker=FormatChecker())


def _require_token(ctx: AppContext, authorization: str | None) -> None:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(401, "unauthorized", "Falta el token de la app.")
    if not ctx.tokens.verify(authorization.split(" ", 1)[1].strip()):
        raise ApiError(401, "unauthorized", "El token de la app no es válido.")


@router.put("/{decision_id}", summary="Guardar una decisión de la comunidad")
def put_decision(
    decision_id: str = Path(..., pattern=ID_PATTERN),
    body: dict[str, Any] = Body(...),
    authorization: str | None = Header(default=None),
    ctx: AppContext = Depends(get_ctx),
) -> dict[str, Any]:
    _require_token(ctx, authorization)
    body.setdefault("id", decision_id)
    errors = sorted(
        _validator(str(ctx.settings.contracts)).iter_errors(body),
        key=lambda error: list(error.path),
    )
    if errors:
        first = errors[0]
        where = "/".join(map(str, first.absolute_path)) or "cuerpo"
        raise ApiError(422, "invalid_request", f"{where}: {first.message}")
    if body["id"] != decision_id:
        raise ApiError(422, "invalid_request", "El id del cuerpo no coincide con la URL.")
    ctx.decisions.upsert(body)
    return body


@router.delete("/{decision_id}", status_code=204, summary="Borrar una decisión")
def delete_decision(
    decision_id: str = Path(..., pattern=ID_PATTERN),
    authorization: str | None = Header(default=None),
    ctx: AppContext = Depends(get_ctx),
) -> Response:
    _require_token(ctx, authorization)
    ctx.decisions.delete(decision_id)
    return Response(status_code=204)


@router.get("", summary="Decisiones guardadas de una comunidad")
def list_decisions(
    community_id: str = Query(..., min_length=1, max_length=64),
    sector_id: str | None = Query(default=None, pattern=r"^S\d+$"),
    ctx: AppContext = Depends(get_ctx),
) -> dict[str, Any]:
    return {"decisions": ctx.decisions.list(community_id, sector_id)}
