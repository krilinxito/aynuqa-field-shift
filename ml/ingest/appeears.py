"""Pide a AppEEARS (NASA) recortes por area en NetCDF-4 y los descarga.

Uso, desde ml/:
    python ingest/appeears.py login                         # prueba las credenciales
    python ingest/appeears.py submit ndvi --zones pumani    # envia un pedido (sin --zones: todas)
    python ingest/appeears.py status                        # estado de los pedidos enviados
    python ingest/appeears.py download                      # baja los pedidos terminados

Pedidos disponibles: ndvi (MODIS Terra y Aqua), dem (NASADEM), smap (SMAP L4).
Credenciales en ml/.env: EARTHDATA_USER (o EARTHDATA_USERNAME) y EARTHDATA_PASSWORD.
Los archivos quedan en ml/data/raw/appeears/<pedido>/. Repetir un comando no duplica nada.
"""
import argparse
import base64
import json
import math
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path

API = "https://appeears.earthdatacloud.nasa.gov/api"
ML_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = ML_DIR / "data" / "raw" / "appeears"
TASKS_FILE = RAW_DIR / "tasks.json"

REQUESTS = {
    "ndvi": {
        "start": "02-18-2000",
        "layers": [
            ("MOD13Q1.061", "_250m_16_days_NDVI"),
            ("MOD13Q1.061", "_250m_16_days_pixel_reliability"),
            ("MYD13Q1.061", "_250m_16_days_NDVI"),
            ("MYD13Q1.061", "_250m_16_days_pixel_reliability"),
        ],
    },
    "dem": {"start": "02-11-2000", "end": "02-21-2000", "layers": [("NASADEM_NC.001", "NASADEM_HGT")]},
    "smap": {"start": "03-31-2015", "layers": [("SPL4SMGP.008", "Geophysical_Data_sm_rootzone")]},
}


def read_env() -> dict[str, str]:
    env = {}
    path = ML_DIR / ".env"
    if not path.exists():
        sys.exit(f"Falta {path} con EARTHDATA_USER y EARTHDATA_PASSWORD.")
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip("\"'")
    return env


def call(method: str, path: str, token: str | None = None, body: dict | None = None, basic: str | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if basic:
        headers["Authorization"] = f"Basic {basic}"
    data = json.dumps(body).encode() if body is not None else (b"" if method == "POST" else None)
    req = urllib.request.Request(f"{API}/{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as err:
        sys.exit(f"AppEEARS respondio {err.code} en {method} {path}: {err.read().decode()[:400]}")


def login() -> str:
    env = read_env()
    user = env.get("EARTHDATA_USER") or env.get("EARTHDATA_USERNAME")
    password = env.get("EARTHDATA_PASSWORD")
    if not user or not password:
        sys.exit("ml/.env debe tener EARTHDATA_USER y EARTHDATA_PASSWORD.")
    basic = base64.b64encode(f"{user}:{password}".encode()).decode()
    return call("POST", "login", basic=basic)["token"]


def load_zones(only: list[str] | None) -> tuple[list[dict], float]:
    config = json.loads((ML_DIR / "zones.json").read_text(encoding="utf-8"))
    zones = [z for z in config["zones"] if not only or z["id"] in only]
    missing = set(only or []) - {z["id"] for z in zones}
    if missing:
        sys.exit(f"Zonas desconocidas: {', '.join(sorted(missing))}")
    return zones, config["box_km"]


def box(zone: dict, box_km: float) -> dict:
    """Recuadro de box_km de lado centrado en la zona, como Feature GeoJSON."""
    dlat = (box_km / 2) / 111.32
    dlon = (box_km / 2) / (111.32 * math.cos(math.radians(zone["lat"])))
    w, e = round(zone["lon"] - dlon, 5), round(zone["lon"] + dlon, 5)
    s, n = round(zone["lat"] - dlat, 5), round(zone["lat"] + dlat, 5)
    return {
        "type": "Feature",
        "properties": {"zone": zone["id"]},
        "geometry": {"type": "Polygon", "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]]},
    }


def load_tasks() -> dict:
    return json.loads(TASKS_FILE.read_text(encoding="utf-8")) if TASKS_FILE.exists() else {}


def save_tasks(tasks: dict) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    TASKS_FILE.write_text(json.dumps(tasks, indent=2) + "\n", encoding="utf-8")


def submit(kind: str, only: list[str] | None, label: str | None = None) -> None:
    spec = REQUESTS[kind]
    zones, box_km = load_zones(only)
    name = f"aynuqa_{kind}_" + (label or ("all" if not only else "_".join(z["id"] for z in zones)))
    tasks = load_tasks()
    if name in tasks:
        sys.exit(f"El pedido {name} ya fue enviado ({tasks[name]['task_id']}). Usa status o download.")
    end = spec.get("end") or (date.today() - timedelta(days=1)).strftime("%m-%d-%Y")
    body = {
        "task_type": "area",
        "task_name": name,
        "params": {
            "dates": [{"startDate": spec["start"], "endDate": end}],
            "layers": [{"product": p, "layer": layer} for p, layer in spec["layers"]],
            "output": {"format": {"type": "netcdf4"}, "projection": "geographic"},
            "geo": {"type": "FeatureCollection", "fileName": name, "features": [box(z, box_km) for z in zones]},
        },
    }
    result = call("POST", "task", token=login(), body=body)
    tasks[name] = {"task_id": result["task_id"], "kind": kind, "zones": [z["id"] for z in zones],
                   "submitted": date.today().isoformat()}
    save_tasks(tasks)
    print(f"Enviado {name}: {result['task_id']} ({result.get('status')})")


def status() -> None:
    tasks = load_tasks()
    if not tasks:
        sys.exit("No hay pedidos enviados.")
    token = login()
    for name, task in tasks.items():
        info = call("GET", f"task/{task['task_id']}", token=token)
        print(f"{name}: {info.get('status')}  creado {info.get('created')}  terminado {info.get('completed')}")


def download() -> None:
    tasks = load_tasks()
    token = login()
    for name, task in tasks.items():
        info = call("GET", f"task/{task['task_id']}", token=token)
        if info.get("status") != "done":
            print(f"{name}: aun no termina ({info.get('status')})")
            continue
        out_dir = RAW_DIR / name
        for item in call("GET", f"bundle/{task['task_id']}", token=token)["files"]:
            target = out_dir / item["file_name"]
            if target.exists() and target.stat().st_size == item["file_size"]:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            fetch_file(f"{API}/bundle/{task['task_id']}/{item['file_id']}", token, target)
            print(f"{name}: {item['file_name']} ({item['file_size'] / 1e6:.1f} MB)")
        print(f"{name}: completo en {out_dir}")


class _NoAuthOnRedirect(urllib.request.HTTPRedirectHandler):
    """AppEEARS redirige a un enlace firmado; ese enlace falla si se reenvia la cabecera Authorization."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return urllib.request.Request(newurl, method="GET")


def fetch_file(url: str, token: str, target: Path) -> None:
    opener = urllib.request.build_opener(_NoAuthOnRedirect)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    tmp = target.with_suffix(target.suffix + ".part")
    with opener.open(req, timeout=600) as resp, open(tmp, "wb") as f:
        while chunk := resp.read(1 << 20):
            f.write(chunk)
    tmp.replace(target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("login")
    p_submit = sub.add_parser("submit")
    p_submit.add_argument("kind", choices=sorted(REQUESTS))
    p_submit.add_argument("--zones", nargs="*", help="ids de zones.json; por defecto, todas")
    p_submit.add_argument("--label", help="nombre corto del pedido; por defecto, las zonas")
    sub.add_parser("status")
    sub.add_parser("download")
    args = parser.parse_args()
    if args.command == "login":
        login()
        print("Credenciales correctas.")
    elif args.command == "submit":
        submit(args.kind, args.zones, args.label)
    elif args.command == "status":
        status()
    else:
        download()


if __name__ == "__main__":
    main()
