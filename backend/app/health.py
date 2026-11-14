"""Respuesta de /health y de /api/admin/reload."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.context import AppContext


def health_payload(ctx: "AppContext") -> dict:
    meta = ctx.db.get_meta()
    return {
        "status": "ok",
        "version": ctx.settings.version,
        "updated_at": meta["updated_at"],
        "sources": meta["sources"],
    }
