"""Errores con la forma del contrato: {"error": {"code", "message"}}."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def _payload(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(exc.code, exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        if not errors:
            message = "La solicitud no es válida."
        else:
            location = [
                str(part)
                for part in errors[0].get("loc", ())
                if part not in ("body", "query", "path", "header")
            ]
            field = ".".join(location)
            message = (
                f"El campo {field} no es válido."
                if field
                else "La solicitud no es válida."
            )
        return JSONResponse(
            status_code=422,
            content=_payload("invalid_request", message),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        codes = {
            401: "unauthorized",
            404: "not_found",
            405: "method_not_allowed",
            422: "invalid_request",
        }
        code = codes.get(exc.status_code, "http_error")
        messages = {
            401: "No autorizado.",
            404: "No se encontró el recurso.",
            405: "Método no permitido.",
        }
        message = messages.get(exc.status_code, "No se pudo completar la solicitud.")
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(code, message),
        )

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Error no controlado en %s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=_payload(
                "internal_error",
                "Ocurrió un error interno. Intenta de nuevo.",
            ),
        )
