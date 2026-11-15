"""Descarga la lluvia mensual de CHIRPS v2.0 (UCSB) para cada zona de zones.json, desde 2000.

Uso, desde ml/:  python ingest/chirps.py
Salida: data/raw/chirps/<zona>.csv con columnas date,precip_mm (total del mes).

Se usa para completar los meses que IMERG Final aun no cubre. CHIRPS mezcla satelite con
estaciones y, contra la estacion SENAMHI Ayo Ayo, ordena bien las campanas recientes, cosa que
IMERG Late no hace. Se baja de la IRI Data Library (Universidad de Columbia), sin cuenta,
pidiendo solo el valor en el punto de cada zona.
"""
import csv
import json
import urllib.request
from datetime import date
from pathlib import Path

ML_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = ML_DIR / "data" / "raw" / "chirps"
BASE = "https://iridl.ldeo.columbia.edu/SOURCES/.UCSB/.CHIRPS/.v2p0/.monthly/.global/.precipitation"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def fetch(zone: dict, end: date) -> list[float]:
    url = (f"{BASE}/X/{zone['lon']}/VALUE/Y/{zone['lat']}/VALUE/"
           f"T/(Jan%202000)/({MONTHS[end.month - 1]}%20{end.year})/RANGEEDGES/data.tsv")
    req = urllib.request.Request(url, headers={"User-Agent": "python-urllib"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                text = resp.read().decode()
            break
        except OSError:
            if attempt == 3:
                raise
            print(f"{zone['id']}: la IRI tardo demasiado, reintento")
    if text.lstrip().startswith("<"):
        raise SystemExit(f"{zone['id']}: la IRI Data Library no devolvio datos")
    return [float(v) for v in text.split()]


def main() -> None:
    zones = json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for zone in zones:
        today = date.today()
        last_month = date(today.year - (today.month == 1), (today.month - 2) % 12 + 1, 1)
        values = fetch(zone, last_month)
        with open(OUT_DIR / f"{zone['id']}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "precip_mm"])
            for i, v in enumerate(values):
                writer.writerow([f"{2000 + i // 12}-{i % 12 + 1:02d}", round(v, 1) if v >= 0 else ""])
        last = len(values) - 1
        print(f"{zone['id']}: {len(values)} meses, hasta {2000 + last // 12}-{last % 12 + 1:02d}")


if __name__ == "__main__":
    main()
