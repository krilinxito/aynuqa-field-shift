from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse, PlainTextResponse

from app.context import AppContext, get_ctx
from app.errors import ApiError
from app.services.report import render_report

router = APIRouter(prefix="/api")


@router.get("/report")
def report(
    scenario: str = Query(default="nino", pattern="^(normal|nino)$"),
    report_format: str = Query(default="md", alias="format", pattern="^(md|html)$"),
    ctx: AppContext = Depends(get_ctx),
):
    payload = ctx.db.get_predictions(scenario)
    if payload is None:
        raise ApiError(404, "not_found", "No hay datos para ese escenario.")
    content = render_report(payload, scenario, report_format)
    filename = "reporte_asamblea." + ("html" if report_format == "html" else "md")
    headers = {"Content-Disposition": f'inline; filename="{filename}"'}
    if report_format == "html":
        return HTMLResponse(content=content, headers=headers)
    return PlainTextResponse(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers=headers,
    )
