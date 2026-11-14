"""Lectura de la serie histórica mensual desde SQLite.

Si el histórico es real y ML todavía no incluyó el mes en curso, se completa
con los días recientes de NASA POWER agregados a mes. Si el histórico es mock,
no se mezcla con datos reales.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING

from app.errors import ApiError
from app.utils import current_month, iso_now, now_bolivia

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
        *,
        extend: bool = True,
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
        extended = False
        if extend and meta["data_source"] == "real" and self._should_extend(
            meta, from_date, to_date
        ):
            recent = self._current_month_row()
            if recent and all(
                not (row["date"] == recent["date"]) for row in rows
            ):
                if (not from_date or recent["date"] >= from_date) and (
                    not to_date or recent["date"] <= to_date
                ):
                    rows.append(recent)
                    rows.sort(key=lambda row: row["date"])
                    extended = True

        actual_from = from_date or (rows[0]["date"] if rows else meta["from"])
        actual_to = to_date or (rows[-1]["date"] if rows else meta["to"])
        return {
            "updated_at": iso_now() if extended else meta["updated_at"],
            "data_source": meta["data_source"],
            "sector_id": sector_id,
            "from": actual_from,
            "to": actual_to,
            "series": rows,
        }

    def _should_extend(
        self,
        meta: dict,
        from_date: str | None,
        to_date: str | None,
    ) -> bool:
        month = current_month()
        if meta["to"] >= month:
            return False
        if from_date and from_date > month:
            return False
        if to_date and to_date < month:
            return False
        return True

    def _current_month_row(self) -> dict | None:
        month = current_month()
        year, month_number = (int(part) for part in month.split("-"))
        start = date(year, month_number, 1)
        end = now_bolivia().date() - timedelta(days=1)
        if end < start:
            return None
        days = self.ctx.power.get_daily(start, end)
        if not days:
            return None

        precip = [row["PRECTOTCORR"] for row in days if row["PRECTOTCORR"] is not None]
        soil = [row["GWETROOT"] for row in days if row["GWETROOT"] is not None]
        temp = [row["T2M"] for row in days if row["T2M"] is not None]
        if not precip and not soil and not temp:
            return None

        return {
            "date": month,
            "ndvi": None,
            "precip_mm": round(sum(precip), 1) if precip else None,
            "soil_moisture": round(sum(soil) / len(soil), 3) if soil else None,
            "temp_c": round(sum(temp) / len(temp), 1) if temp else None,
            "roni": None,
        }
