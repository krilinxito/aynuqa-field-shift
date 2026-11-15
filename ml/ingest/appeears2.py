"""Descarga rápida de AppEEARS para el MVP: solo lo que necesita el modelo, repartido en 5 cuentas.

Comparado con appeears.py (que baja todo y tarda horas), cada pedido aquí es mucho más chico:
- Solo MODIS Terra (MOD13Q1): NDVI y fiabilidad del píxel. Sin Aqua.
- Solo los compuestos que usa el modelo, en todos los años desde 2000 (fechas que se repiten):
  febrero a abril (el objetivo y la campaña anterior) y septiembre (estado al decidir).
- Recuadro de 5 km por zona en vez de 10: los 13 sectores quedan a menos de 2 km del pueblo.
- Febrero a abril y septiembre van en pedidos separados (uno corto y uno muy corto).

Cada persona usa una cuenta secundaria de Earthdata con la cola vacía, en ml/.env.fast
(EARTHDATA_USER y EARTHDATA_PASSWORD; si no existe, se usa ml/.env), y corre solo su parte.
Uso, desde ml/:
    python ingest/appeears2.py login             # prueba las credenciales
    python ingest/appeears2.py submit 3          # envía los pedidos de la parte 3
    python ingest/appeears2.py status            # estado de tus pedidos
    python ingest/appeears2.py download --wait   # espera y baja todo lo que termine

Los archivos quedan en ml/data/raw/appeears/aynuqa_ndvi_fast_*/ y aynuqa_dem_fast_*/.
No toca los pedidos de appeears.py: lleva su propio registro en tasks_fast.json.
"""
import argparse
import json
import math
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import appeears  # noqa: E402
from appeears import ML_DIR, RAW_DIR, call, fetch_file, load_zones  # noqa: E402

FAST_ENV = ML_DIR / ".env.fast"


def login() -> str:
    """Usa la cuenta secundaria de ml/.env.fast si existe; si no, la de ml/.env.

    Así cada persona puede bajar su parte con una cuenta con la cola vacía sin tocar su ml/.env.
    """
    if FAST_ENV.exists():
        original = appeears.read_env

        def read_fast_env() -> dict[str, str]:
            env = {}
            for line in FAST_ENV.read_text(encoding="utf-8-sig").splitlines():
                if "=" in line and not line.lstrip().startswith("#"):
                    key, value = line.split("=", 1)
                    env[key.strip()] = value.strip().strip("\"'")
            return env

        appeears.read_env = read_fast_env
        try:
            return appeears.login()
        finally:
            appeears.read_env = original
    return appeears.login()

TASKS_FILE = RAW_DIR / "tasks_fast.json"
BOX_KM = 5
TERRA = [("MOD13Q1.061", "_250m_16_days_NDVI"), ("MOD13Q1.061", "_250m_16_days_pixel_reliability")]

# Las fechas son de inicio de cada compuesto de 16 días; el mes se asigna por su día central.
KINDS = {
    "febabr": {"layers": TERRA, "dates": [{"startDate": "01-24", "endDate": "04-22", "recurring": True,
                                           "yearRange": [2000, date.today().year]}]},
    "sep": {"layers": TERRA, "dates": [{"startDate": "08-24", "endDate": "09-20", "recurring": True,
                                        "yearRange": [2000, date.today().year]}]},
    "dem": {"layers": [("NASADEM_NC.001", "NASADEM_HGT")],
            "dates": [{"startDate": "02-11-2000", "endDate": "02-21-2000"}]},
    # Historia completa de Pomani (todos los meses, solo Terra). Va al final de una cola: no bloquea el MVP.
    "terra_full": {"layers": TERRA, "dates": [{"startDate": "02-18-2000",
                                               "endDate": date.today().strftime("%m-%d-%Y")}]},
}

# Una parte por persona. En cada cuenta AppEEARS procesa los pedidos de a uno, en este orden.
PARTS = {
    "1": [("dem", ["pumani"]), ("febabr", ["pumani"]), ("sep", ["pumani"])],
    "2": [("febabr", ["patacamaya", "jesus_de_machaca"]), ("sep", ["patacamaya", "jesus_de_machaca"])],
    "3": [("febabr", ["tiahuanaco", "caquiaviri"]), ("sep", ["tiahuanaco", "caquiaviri"])],
    "4": [("febabr", ["sica_sica", "curahuara"]), ("sep", ["sica_sica", "curahuara"])],
    "5": [("febabr", ["toledo"]), ("sep", ["toledo"]), ("terra_full", ["pumani"])],
}


def box(zone: dict) -> dict:
    dlat = (BOX_KM / 2) / 111.32
    dlon = (BOX_KM / 2) / (111.32 * math.cos(math.radians(zone["lat"])))
    w, e = round(zone["lon"] - dlon, 5), round(zone["lon"] + dlon, 5)
    s, n = round(zone["lat"] - dlat, 5), round(zone["lat"] + dlat, 5)
    return {"type": "Feature", "properties": {"zone": zone["id"]},
            "geometry": {"type": "Polygon", "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]]}}


def load_tasks() -> dict:
    return json.loads(TASKS_FILE.read_text(encoding="utf-8")) if TASKS_FILE.exists() else {}


def save_tasks(tasks: dict) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    TASKS_FILE.write_text(json.dumps(tasks, indent=2) + "\n", encoding="utf-8")


def task_name(kind: str, zone_ids: list[str]) -> str:
    prefix = "aynuqa_dem_fast" if kind == "dem" else f"aynuqa_ndvi_fast_{kind}"
    return f"{prefix}_{'_'.join(zone_ids)}"


def submit(part: str) -> None:
    tasks = load_tasks()
    token = login()
    for kind, zone_ids in PARTS[part]:
        zones, _ = load_zones(zone_ids)
        name = task_name(kind, zone_ids)
        if name in tasks:
            print(f"{name}: ya enviado ({tasks[name]['task_id']})")
            continue
        spec = KINDS[kind]
        body = {
            "task_type": "area",
            "task_name": name,
            "params": {
                "dates": spec["dates"],
                "layers": [{"product": p, "layer": layer} for p, layer in spec["layers"]],
                "output": {"format": {"type": "netcdf4"}, "projection": "geographic"},
                "geo": {"type": "FeatureCollection", "fileName": name, "features": [box(z) for z in zones]},
            },
        }
        result = call("POST", "task", token=token, body=body)
        tasks[name] = {"task_id": result["task_id"], "kind": kind, "zones": zone_ids,
                       "submitted": date.today().isoformat()}
        save_tasks(tasks)
        print(f"Enviado {name}: {result['task_id']} ({result.get('status')})")


def status() -> None:
    tasks = load_tasks()
    if not tasks:
        sys.exit("No hay pedidos enviados con appeears2.py.")
    token = login()
    for name, task in tasks.items():
        info = call("GET", f"task/{task['task_id']}", token=token)
        print(f"{name}: {info.get('status')}  creado {info.get('created')}  terminado {info.get('completed')}")


def download_once() -> int:
    tasks = load_tasks()
    if not tasks:
        sys.exit("No hay pedidos enviados con appeears2.py.")
    token = login()
    pending = 0
    for name, task in tasks.items():
        info = call("GET", f"task/{task['task_id']}", token=token)
        if info.get("status") != "done":
            print(f"{name}: aun no termina ({info.get('status')})")
            pending += 1
            continue
        out_dir = RAW_DIR / name
        for item in call("GET", f"bundle/{task['task_id']}", token=token)["files"]:
            target = out_dir / item["file_name"]
            if target.exists() and target.stat().st_size == item["file_size"]:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            fetch_file(f"https://appeears.earthdatacloud.nasa.gov/api/bundle/{task['task_id']}/{item['file_id']}",
                       token, target)
        print(f"{name}: completo en {out_dir}")
    return pending


def download(wait: bool) -> None:
    while True:
        try:
            pending = download_once()
        except Exception as err:  # noqa: BLE001 - cortes de red: se reintenta
            if not wait:
                raise
            print(f"Error de conexión ({err}); reintento en 2 minutos")
            pending = 1
        if not wait or pending == 0:
            if pending == 0:
                print("Todo descargado. Ahora sube los archivos (ver el mensaje del equipo).")
            return
        print(f"{time.strftime('%H:%M')} faltan {pending} pedido(s); reviso de nuevo en 2 minutos")
        time.sleep(120)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("login")
    p_submit = sub.add_parser("submit")
    p_submit.add_argument("part", choices=sorted(PARTS), help="tu número de parte (1 a 5)")
    sub.add_parser("status")
    p_download = sub.add_parser("download")
    p_download.add_argument("--wait", action="store_true", help="esperar y bajar hasta que termine todo")
    args = parser.parse_args()
    if args.command == "login":
        login()
        print("Credenciales correctas.")
    elif args.command == "submit":
        submit(args.part)
    elif args.command == "status":
        status()
    else:
        download(args.wait)


if __name__ == "__main__":
    main()
