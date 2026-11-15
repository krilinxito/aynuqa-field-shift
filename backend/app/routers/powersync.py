"""Credenciales de solo lectura para sincronizar instantáneas comunitarias."""

from fastapi import APIRouter, Depends

from app.context import AppContext, get_ctx

router = APIRouter(prefix="/api/powersync", tags=["powersync"])


@router.get("/jwks")
def powersync_jwks(ctx: AppContext = Depends(get_ctx)) -> dict:
    return ctx.tokens.jwks()


@router.get("/token")
def powersync_token(ctx: AppContext = Depends(get_ctx)) -> dict:
    token, expires_at = ctx.tokens.issue()
    return {
        "token": token,
        "endpoint": ctx.settings.powersync_public_url,
        "expires_at": expires_at.isoformat(),
    }
