"""Lectura de la serie histórica mensual desde SQLite.

La historia es exactamente la que exportó ML, hasta su último mes. Back no la
completa con otras fuentes: ML calcula la lluvia con IMERG y CHIRPS, y mezclar
un mes parcial de NASA POWER daría una cifra de otra fuente y de pocos días,
que en el gráfico parecería sequía. Para tener meses nuevos se vuelve a correr
ML y se llama a POST /api/admin/reload.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.errors import ApiError

if TYPE_CHECKING:
    from app.context import AppContext


class HistoryService:
    def __init__(self, ctx: "AppContext") -> None:
        self.ctx = ctx

    def get(
        self,
        sector_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict:
        meta = self.ctx.db.get_history_meta()
        if not meta:
            raise ApiError(
                404,
                "sector_not_found",
                "No hay datos históricos cargados.",
            )
        if not self.ctx.db.sector_exists(sector_id):
            raise ApiError(
                404,
                "sector_not_found",
                f"No tengo datos del sector {sector_id}.",
            )
        if from_date and to_date and from_date > to_date:
            raise ApiError(
                422,
                "invalid_request",
                "La fecha inicial no puede ser posterior a la final.",
            )

        rows = self.ctx.db.get_history(sector_id, from_date, to_date)
        return {
            "updated_at": meta["updated_at"],
            "data_source": meta["data_source"],
            "sector_id": sector_id,
            "from": from_date or (rows[0]["date"] if rows else meta["from"]),
            "to": to_date or (rows[-1]["date"] if rows else meta["to"]),
            "series": rows,
        }
