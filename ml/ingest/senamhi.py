"""Convierte la descarga diaria del SENAMHI (Excel de la consulta publica) a CSV.

Uso, desde ml/:  python ingest/senamhi.py data/raw/senamhi/dato_diarios.xlsx
Salida: data/raw/senamhi/<estacion>.csv con columnas
date,station,lat,lon,elevation_m,precip_mm,tmax_c,tmin_c.

La consulta publica del SENAMHI (sismet) solo entrega unos 5 anios. Se usa para validar la
lluvia y la temperatura satelitales, no para entrenar.
"""
import sys
import unicodedata
from pathlib import Path

import pandas as pd

OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "raw" / "senamhi"


def slug(text: str) -> str:
    plain = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return "_".join(plain.lower().split())


def main() -> None:
    raw = pd.read_excel(sys.argv[1])
    # Las columnas vienen con tildes mal codificadas; se usan por posicion.
    raw.columns = ["year", "month", "day", "station", "lon", "lat", "elevation_m", "precip_mm", "tmax_c", "tmin_c"]
    raw["date"] = pd.to_datetime(dict(year=raw.year, month=raw.month, day=raw.day)).dt.strftime("%Y-%m-%d")
    for station, rows in raw.groupby("station"):
        out = OUT_DIR / f"{slug(station)}.csv"
        cols = ["date", "station", "lat", "lon", "elevation_m", "precip_mm", "tmax_c", "tmin_c"]
        rows.sort_values("date")[cols].to_csv(out, index=False, encoding="utf-8")
        print(f"{station}: {len(rows)} dias, {rows.date.min()} a {rows.date.max()}, en {out}")


if __name__ == "__main__":
    main()
