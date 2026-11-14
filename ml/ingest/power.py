"""Descarga el clima diario de NASA POWER para cada zona de zones.json, desde 2000.

Uso, desde ml/:  python ingest/power.py [--zones pumani toledo]
Salida: data/raw/power/<zona>.csv con columnas date,T2M,PRECTOTCORR,GWETROOT,ALLSKY_SFC_SW_DWN.
Los datos faltantes (-999 en NASA POWER) quedan vacios. No necesita cuenta.
"""
import argparse
import csv
import json
import urllib.request
from datetime import date, timedelta
from pathlib import Path

API = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = ["T2M", "PRECTOTCORR", "GWETROOT", "ALLSKY_SFC_SW_DWN"]
ML_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = ML_DIR / "data" / "raw" / "power"


def fetch(zone: dict, end: str) -> dict:
    url = (f"{API}?parameters={','.join(PARAMETERS)}&community=AG&longitude={zone['lon']}"
           f"&latitude={zone['lat']}&start=20000101&end={end}&format=JSON")
    with urllib.request.urlopen(url, timeout=180) as resp:
        return json.loads(resp.read().decode())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--zones", nargs="*", help="ids de zones.json; por defecto, todas")
    args = parser.parse_args()
    zones = json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]
    if args.zones:
        zones = [z for z in zones if z["id"] in args.zones]
    end = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for zone in zones:
        data = fetch(zone, end)
        series = data["properties"]["parameter"]
        days = sorted(series[PARAMETERS[0]])
        missing = 0
        with open(OUT_DIR / f"{zone['id']}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["date", *PARAMETERS])
            for day in days:
                values = [series[p].get(day, -999) for p in PARAMETERS]
                missing += sum(v == -999 for v in values)
                writer.writerow([f"{day[:4]}-{day[4:6]}-{day[6:]}", *("" if v == -999 else v for v in values)])
        cell_elevation = data["geometry"]["coordinates"][2]
        print(f"{zone['id']}: {len(days)} dias, {missing} valores faltantes, altitud de la celda {cell_elevation:.0f} m")


if __name__ == "__main__":
    main()
