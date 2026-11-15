from fastapi import APIRouter, Depends

from app.context import AppContext, get_ctx
from app.health import health_payload

router = APIRouter()


@router.get("/health")
def health(ctx: AppContext = Depends(get_ctx)) -> dict:
    return health_payload(ctx)
