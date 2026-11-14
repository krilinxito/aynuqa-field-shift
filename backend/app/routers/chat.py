from fastapi import APIRouter, Depends

from app.context import AppContext, get_ctx
from app.errors import ApiError
from app.schemas import ChatRequest, ChatResponse, ErrorResponse

router = APIRouter(prefix="/api")

CHAT_DESCRIPTION = """\
Responde una pregunta de la asamblea con Gemini y hasta cinco rondas de
herramientas internas. El endpoint es stateless: no guarda sesiones ni
historial.

Herramientas disponibles: `get_sector`, `compare_scenarios`, `get_history`,
`get_sensors` y `get_twin_precedent`. Todas leen SQLite o el simulador de
sensores; el modelo solo explica los valores que devuelven.

La respuesta incluye `sources` con las herramientas y campos consultados, y
`confidence_note` con la confianza mínima usada. Sin `LLM_API_KEY` o
`LLM_MODEL`, responde `502 llm_unavailable`.
"""


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat de la asamblea con tool calling",
    description=CHAT_DESCRIPTION,
    responses={
        404: {
            "model": ErrorResponse,
            "description": "El sector no existe.",
        },
        422: {
            "model": ErrorResponse,
            "description": "Cuerpo de la solicitud inválido.",
        },
        502: {
            "model": ErrorResponse,
            "description": "El modelo de lenguaje no está disponible.",
        },
    },
)
def chat(
    body: ChatRequest,
    ctx: AppContext = Depends(get_ctx),
) -> ChatResponse:
    if body.sector_id and not ctx.db.sector_exists(body.sector_id):
        raise ApiError(
            404,
            "sector_not_found",
            f"No tengo datos del sector {body.sector_id}.",
        )
    result = ctx.chat.answer(
        message=body.message,
        sector_id=body.sector_id,
        scenario=body.scenario,
    )
    return ChatResponse.model_validate(result)
