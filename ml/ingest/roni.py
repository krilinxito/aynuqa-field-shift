"""Descarga los indices RONI (oficial) y ONI (referencia) de NOAA CPC.

Uso, desde ml/:  python ingest/roni.py
Salida: data/raw/enso/roni.csv y data/raw/enso/oni.csv con columnas date,season,value.
`date` es el mes central de la temporada de tres meses (DJF -> enero).
"""
import csv
import urllib.request
from pathlib import Path

SOURCES = {
    "roni": "https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt",
    "oni": "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
}
SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"]
OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "raw" / "enso"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "python-urllib"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse(text: str) -> list[tuple[str, str, float]]:
    """Cada linea de datos es: temporada, anio, [total,] anomalia. La anomalia es la ultima columna."""
    rows = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) < 3 or parts[0] not in SEASONS:
            continue
        month = SEASONS.index(parts[0]) + 1
        rows.append((f"{int(parts[1]):04d}-{month:02d}", parts[0], float(parts[-1])))
    return rows


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in SOURCES.items():
        rows = parse(fetch(url))
        if not rows:
            raise SystemExit(f"{name}: no se pudo leer ninguna fila de {url}")
        with open(OUT_DIR / f"{name}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "season", "value"])
            writer.writerows(rows)
        print(f"{name}: {len(rows)} filas, {rows[0][0]} a {rows[-1][0]}, ultimo valor {rows[-1][2]:+.2f}")


if __name__ == "__main__":
    main()
