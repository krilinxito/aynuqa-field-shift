from fastapi import APIRouter, Depends, Path, Query

from app.context import AppContext, get_ctx
from app.errors import ApiError

router = APIRouter(prefix="/api")

MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


@router.get("/sectors")
def get_sectors(
    scenario: str = Query(default="nino", pattern="^(normal|nino)$"),
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    payload = ctx.db.get_predictions(scenario)
    if payload is None:
        raise ApiError(404, "not_found", "No hay datos para ese escenario.")
    return payload


@router.get("/sectors/{sector_id}/history")
def get_history(
    sector_id: str = Path(pattern=r"^S\d+$"),
    from_date: str | None = Query(default=None, alias="from", pattern=MONTH_PATTERN),
    to_date: str | None = Query(default=None, alias="to", pattern=MONTH_PATTERN),
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    return ctx.history.get(sector_id, from_date, to_date)


@router.get("/sectors/{sector_id}/sensors")
def get_sensors(
    sector_id: str = Path(pattern=r"^S\d+$"),
    hours: int = Query(default=48, ge=1, le=168),
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    if not ctx.db.sector_exists(sector_id):
        raise ApiError(
            404,
            "sector_not_found",
            f"No tengo datos del sector {sector_id}.",
        )
    return ctx.sensors.generate(sector_id, hours)
