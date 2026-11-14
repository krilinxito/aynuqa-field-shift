"""Descarga la lluvia mensual de NASA GPM IMERG (V07, Final) para cada zona de zones.json.

Uso, desde ml/:  python ingest/imerg.py
Salida: data/raw/imerg/<zona>.csv con columnas date,precip_mm (total del mes).

Pide por OPeNDAP solo la celda de 0,1 grados que contiene cada zona, no el archivo global.
Necesita ml/.env con EARTHDATA_USER y EARTHDATA_PASSWORD, y que la cuenta haya autorizado la
aplicacion "NASA GESDISC DATA ARCHIVE" en urs.earthdata.nasa.gov (Applications > Authorized Apps).
El producto Final llega con unos 3 a 4 meses de retraso.
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
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import netCDF4

sys.path.insert(0, str(Path(__file__).resolve().parent))
from appeears import ML_DIR, read_env  # noqa: E402

CMR = "https://cmr.earthdata.nasa.gov/search/granules.json"
COLLECTION = "GPM_3IMERGM"
OUT_DIR = ML_DIR / "data" / "raw" / "imerg"
CELL = 0.1
NETCDF_LOCK = threading.Lock()  # la libreria netCDF no admite lecturas en paralelo


def token() -> str:
    env = read_env()
    user = env.get("EARTHDATA_USER") or env.get("EARTHDATA_USERNAME")
    basic = base64.b64encode(f"{user}:{env['EARTHDATA_PASSWORD']}".encode()).decode()
    req = urllib.request.Request("https://urs.earthdata.nasa.gov/api/users/find_or_create_token",
                                 data=b"", method="POST", headers={"Authorization": f"Basic {basic}"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())["access_token"]


def granules() -> list[tuple[str, str]]:
    """(mes YYYY-MM, enlace OPeNDAP) de cada archivo mensual desde junio de 2000."""
    query = urllib.parse.urlencode({"short_name": COLLECTION, "version": "07", "page_size": 2000,
                                    "sort_key": "start_date", "temporal": "2000-06-01T00:00:00Z,"})
    with urllib.request.urlopen(f"{CMR}?{query}", timeout=120) as resp:
        entries = json.loads(resp.read().decode())["feed"]["entry"]
    out = []
    for entry in entries:
        link = next(l["href"] for l in entry["links"] if l["href"].startswith("https://opendap.earthdata.nasa.gov"))
        out.append((entry["time_start"][:7], link))
    return out


def cell_index(value: float, origin: float) -> int:
    return math.floor((value - origin) / CELL)


def fetch_month(month: str, link: str, auth: str, cells: dict[str, tuple[int, int]]) -> dict[str, float | None]:
    lon_idx = [i for i, _ in cells.values()]
    lat_idx = [j for _, j in cells.values()]
    i0, i1, j0, j1 = min(lon_idx), max(lon_idx), min(lat_idx), max(lat_idx)
    ce = f"/Grid/precipitation[0][{i0}:{i1}][{j0}:{j1}]"
    url = f"{link}.dap.nc4?dap4.ce={urllib.parse.quote(ce)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {auth}"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = resp.read()
            break
        except Exception:
            if attempt == 2:
                raise
    with NETCDF_LOCK, netCDF4.Dataset("imerg", memory=data) as ds:
        var = ds["/Grid/precipitation"] if "Grid" in ds.groups else ds["precipitation"]
        units = var.units
        rate = var[:][0]
    if units.strip() not in ("mm/hr", "mm/h"):
        raise SystemExit(f"Unidades inesperadas en IMERG: {units}")
    year, mon = int(month[:4]), int(month[5:])
    hours = calendar.monthrange(year, mon)[1] * 24
    values = {}
    for zone_id, (i, j) in cells.items():
        v = rate[i - i0, j - j0]
        values[zone_id] = None if v is None or getattr(v, "mask", False) or v < 0 else round(float(v) * hours, 1)
    return values


def main() -> None:
    zones = json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]
    # La grilla de IMERG empieza en -180 (lon) y -90 (lat) y el eje de longitud va primero.
    cells = {z["id"]: (cell_index(z["lon"], -180), cell_index(z["lat"], -90)) for z in zones}
    auth = token()
    months = granules()
    print(f"{len(months)} meses, {months[0][0]} a {months[-1][0]}")
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda g: fetch_month(g[0], g[1], auth, cells), months))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for zone in zones:
        path = OUT_DIR / f"{zone['id']}.csv"
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "precip_mm"])
            for (month, _), values in zip(months, results):
                writer.writerow([month, "" if values[zone["id"]] is None else values[zone["id"]]])
        print(f"{zone['id']}: {path}")


if __name__ == "__main__":
    main()
