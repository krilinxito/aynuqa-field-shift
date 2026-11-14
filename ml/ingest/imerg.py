"""Descarga la lluvia mensual de NASA GPM IMERG V07 para cada zona de zones.json.

Uso, desde ml/:  python ingest/imerg.py [final|late]   (sin argumento: las dos)

- final: IMERG Final mensual (GPM_3IMERGM), desde 2000-06. Calibrado con pluviometros, pero
  llega con unos 3 a 4 meses de retraso.
  Salida: data/raw/imerg/<zona>.csv con date,precip_mm.
- late: IMERG Late diario (GPM_3IMERGDL), desde 2023-10, sumado por mes. Llega en horas, pero
  no tiene la calibracion con pluviometros: prep/ lo ajusta con los meses en que hay Final.
  Salida: data/raw/imerg/late/<zona>.csv con date,precip_mm,days (dias con dato).

Pide por OPeNDAP solo las celdas de 0,1 grados de las zonas, no los archivos globales.
Necesita ml/.env con EARTHDATA_USER y EARTHDATA_PASSWORD, y que la cuenta haya autorizado la
aplicacion "NASA GESDISC DATA ARCHIVE" en urs.earthdata.nasa.gov (Applications > Authorized Apps).
"""
import base64
import calendar
import csv
import json
import math
import sys
import threading
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import netCDF4

sys.path.insert(0, str(Path(__file__).resolve().parent))
from appeears import ML_DIR, read_env  # noqa: E402

CMR = "https://cmr.earthdata.nasa.gov/search/granules.json"
OUT_DIR = ML_DIR / "data" / "raw" / "imerg"
CELL = 0.1
NETCDF_LOCK = threading.Lock()  # la libreria netCDF no admite lecturas en paralelo

PRODUCTS = {
    "final": {"short_name": "GPM_3IMERGM", "start": "2000-06-01", "variable": "/Grid/precipitation",
              "units": "mm/hr", "out": OUT_DIR},
    "late": {"short_name": "GPM_3IMERGDL", "start": "2023-10-01", "variable": "/precipitation",
             "units": "mm/day", "out": OUT_DIR / "late"},
}


def token() -> str:
    env = read_env()
    user = env.get("EARTHDATA_USER") or env.get("EARTHDATA_USERNAME")
    basic = base64.b64encode(f"{user}:{env['EARTHDATA_PASSWORD']}".encode()).decode()
    req = urllib.request.Request("https://urs.earthdata.nasa.gov/api/users/find_or_create_token",
                                 data=b"", method="POST", headers={"Authorization": f"Basic {basic}"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())["access_token"]


def granules(short_name: str, start: str) -> list[tuple[str, str]]:
    """(fecha YYYY-MM-DD, enlace OPeNDAP) de cada archivo desde start, en orden."""
    out, page = [], 1
    while True:
        query = urllib.parse.urlencode({"short_name": short_name, "version": "07", "page_size": 2000,
                                        "page_num": page, "sort_key": "start_date",
                                        "temporal": f"{start}T00:00:00Z,"})
        with urllib.request.urlopen(f"{CMR}?{query}", timeout=120) as resp:
            entries = json.loads(resp.read().decode())["feed"]["entry"]
        for entry in entries:
            link = next(l["href"] for l in entry["links"] if l["href"].startswith("https://opendap.earthdata.nasa.gov"))
            out.append((entry["time_start"][:10], link))
        if len(entries) < 2000:
            return out
        page += 1


def cell_index(value: float, origin: float) -> int:
    return math.floor((value - origin) / CELL)


def fetch(day: str, link: str, spec: dict, auth: str, cells: dict[str, tuple[int, int]]) -> dict[str, float | None]:
    """Lluvia total (mm) del periodo del archivo en la celda de cada zona."""
    lon_idx = [i for i, _ in cells.values()]
    lat_idx = [j for _, j in cells.values()]
    i0, i1, j0, j1 = min(lon_idx), max(lon_idx), min(lat_idx), max(lat_idx)
    ce = f"{spec['variable']}[0][{i0}:{i1}][{j0}:{j1}]"
    req = urllib.request.Request(f"{link}.dap.nc4?dap4.ce={urllib.parse.quote(ce)}",
                                 headers={"Authorization": f"Bearer {auth}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = resp.read()
            break
        except Exception:
            if attempt == 3:
                raise
    with NETCDF_LOCK, netCDF4.Dataset("imerg", memory=data) as ds:
        group = ds["Grid"] if "Grid" in ds.groups else ds
        var = group["precipitation"]
        units = var.units.strip()
        rate = var[:][0]
    if units != spec["units"]:
        raise SystemExit(f"Unidades inesperadas en {spec['short_name']}: {units}")
    year, month = int(day[:4]), int(day[5:7])
    factor = calendar.monthrange(year, month)[1] * 24 if units == "mm/hr" else 1
    values = {}
    for zone_id, (i, j) in cells.items():
        v = rate[i - i0, j - j0]
        values[zone_id] = None if getattr(v, "mask", False) or v < 0 else float(v) * factor
    return values


def download(kind: str, zones: list[dict], auth: str) -> None:
    spec = PRODUCTS[kind]
    # La grilla de IMERG empieza en -180 (lon) y -90 (lat) y el eje de longitud va primero.
    cells = {z["id"]: (cell_index(z["lon"], -180), cell_index(z["lat"], -90)) for z in zones}
    files = granules(spec["short_name"], spec["start"])
    print(f"{kind}: {len(files)} archivos, {files[0][0]} a {files[-1][0]}")
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda g: fetch(g[0], g[1], spec, auth, cells), files))
    spec["out"].mkdir(parents=True, exist_ok=True)
    for zone in zones:
        totals, days = defaultdict(float), defaultdict(int)
        for (day, _), values in zip(files, results):
            if values[zone["id"]] is not None:
                totals[day[:7]] += values[zone["id"]]
                days[day[:7]] += 1
        with open(spec["out"] / f"{zone['id']}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "precip_mm"] + (["days"] if kind == "late" else []))
            for month in sorted(totals):
                writer.writerow([month, round(totals[month], 1)] + ([days[month]] if kind == "late" else []))
    print(f"{kind}: {len(zones)} zonas en {spec['out']}")


def main() -> None:
    kinds = sys.argv[1:] or list(PRODUCTS)
    zones = json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]
    auth = token()
    for kind in kinds:
        download(kind, zones, auth)


if __name__ == "__main__":
    main()
