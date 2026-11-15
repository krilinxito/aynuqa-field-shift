import secrets

from fastapi import APIRouter, Depends, Header

from app.context import AppContext, get_ctx
from app.errors import ApiError
from app.health import health_payload

router = APIRouter(prefix="/api")


@router.post("/admin/reload")
def reload_predictions(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    ctx: AppContext = Depends(get_ctx),
) -> dict:
    expected = ctx.settings.admin_token
    if not expected:
        raise ApiError(
            401,
            "unauthorized",
            "El token de administración no está configurado.",
        )
    if not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise ApiError(
            401,
            "unauthorized",
            "Falta el token de administración o es incorrecto.",
        )
    ctx.loader.load_all()
    ctx.sync_offline_snapshots()
    return health_payload(ctx)
