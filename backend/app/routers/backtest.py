from fastapi import APIRouter, Depends, Query

from app.context import AppContext, get_ctx
from app.errors import ApiError

router = APIRouter(prefix="/api")

EVENTS = ("2015-16", "2023-24", "2020-22")


@router.get("/backtest")
def get_backtest(
    event: str = Query(default="2015-16"),
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    if event not in EVENTS:
        raise ApiError(
            422,
            "invalid_request",
            f"El evento debe ser uno de: {', '.join(EVENTS)}.",
        )
    payload = ctx.db.get_backtest(event)
    if payload is None:
        raise ApiError(
            404,
            "event_not_found",
            f"No tengo el backtest del evento {event}.",
        )
    return payload
