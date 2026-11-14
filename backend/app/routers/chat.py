from fastapi import APIRouter, Depends

from app.context import AppContext, get_ctx
from app.errors import ApiError
from app.schemas import ChatRequest

router = APIRouter(prefix="/api")


@router.post("/chat")
def chat(
    body: ChatRequest,
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    if body.sector_id and not ctx.db.sector_exists(body.sector_id):
        raise ApiError(
            404,
            "sector_not_found",
            f"No tengo datos del sector {body.sector_id}.",
        )
    return ctx.chat.answer(
        message=body.message,
        sector_id=body.sector_id,
        scenario=body.scenario,
    )
