"""
export.py — Genera los 6 archivos JSON de salida (contracts/ml_outputs.md)
y los valida contra contracts/*.schema.json antes de escribirlos.
"""
import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

CONTRACTS_DIR = Path(__file__).parent.parent.parent / "contracts"
ZONES_JSON = Path(__file__).parent.parent / "zones.json"
BOLIVIA_TZ = timezone(timedelta(hours=-4))

MONTH_INITIALS = {
    1: "E", 2: "F", 3: "M", 4: "A", 5: "M", 6: "J",
    7: "J", 8: "A", 9: "S", 10: "O", 11: "N", 12: "D",
}
# Convención NOAA (en inglés): JFM, FMA, ..., ASO, SON, OND, NDJ, DJF
NOAA_SEASONS = {
    1: "DJF", 2: "JFM", 3: "FMA", 4: "MAM", 5: "AMJ", 6: "MJJ",
    7: "JJA", 8: "JAS", 9: "ASO", 10: "SON", 11: "OND", 12: "NDJ",
}


def _detect_data_source(input_dir: str) -> str:
    """Devuelve 'real' solo cuando la entrada es ml/data/interim (contiene interim), 'mock' en otro caso."""
    parts = [p.lower() for p in Path(input_dir).parts]
    if "interim" in parts and "fake" not in parts:
        return "real"
    return "mock"


def _load_pumani_zone_info() -> dict:
    default = {"id": "pumani", "name": "Pumani", "lat": -17.09, "lon": -68.0}
    if not ZONES_JSON.exists():
        return default
    with open(ZONES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    for z in data.get("zones", []):
        if z.get("id") == "pumani":
            return {
                "id": z["id"],
                "name": z["name"],
                "lat": float(z["lat"]),
                "lon": float(z["lon"]),
            }
    return default


def _load_schema(name: str) -> dict:
    path = CONTRACTS_DIR / name
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _validate(data: dict, schema: dict, label: str):
    """Valida data contra schema. Lanza excepción si falla."""
    import jsonschema

    validator_cls = getattr(jsonschema, "Draft202012Validator", jsonschema.Draft7Validator)
    format_checker = getattr(validator_cls, "FORMAT_CHECKER", None)
    validator = validator_cls(schema, format_checker=format_checker)
    errors = list(validator.iter_errors(data))
    if errors:
        msgs = "\n".join(f"{'/'.join(map(str, e.absolute_path))}: {e.message}" for e in errors[:5])
        raise ValueError(f"Schema validation failed for {label}:\n{msgs}")


def _write_json_safe(data: dict, path: str):
    """Serializa verificando allow_nan=False antes de escribir para no corromper el archivo previo."""
    payload = json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"  → {path}")


def _now_iso() -> str:
    return datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%dT%H:%M:%S-04:00")


def _opt_round(val, ndigits: int):
    if val is None or pd.isna(val):
        return None
    return round(float(val), ndigits)


def _load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _make_centroid(feature: dict) -> dict:
    coords = feature["geometry"]["coordinates"][0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {"lat": round(sum(lats) / len(lats), 6), "lon": round(sum(lons) / len(lons), 6)}


def _sector_sort_key(sid: str):
    return (0, int(sid[1:])) if sid.startswith("S") and sid[1:].isdigit() else (1, sid)


def build_predictions(input_dir: str, output_dir: str, data_source: str):
    """Genera y valida predictions.json antes de guardarlo."""
    from ml.export.rules import recommend

    pred_raw = _load_json(os.path.join(output_dir, "predictions_raw.json"))
    restrend_raw = _load_json(os.path.join(output_dir, "restrend_raw.json"))
    analogs_raw = _load_json(os.path.join(output_dir, "analogs_raw.json"))
    gj = _load_json(os.path.join(input_dir, "sectors.geojson"))
    mdf = pd.read_csv(os.path.join(input_dir, "monthly.csv"))
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")

    feat_by_id = {}
    for feat in gj["features"]:
        p = feat["properties"]
        feat_by_id[(p["zone_id"], p["sector_id"])] = feat

    pumani_monthly = mdf[mdf["zone_id"] == "pumani"].sort_values("date_dt")
    # Último mes observado de clima en Pumani
    zone_monthly = pumani_monthly.drop_duplicates(subset=["date"]).sort_values("date_dt")
    last_clim = zone_monthly.iloc[-1]
    last_month = str(last_clim["date"])
    last_year = int(last_clim["date_dt"].year)
    last_month_num = int(last_clim["date_dt"].month)

    valid_roni = zone_monthly[zone_monthly["roni"].notna()]
    if len(valid_roni) > 0:
        last_roni_row = valid_roni.iloc[-1]
        last_roni = float(last_roni_row["roni"])
        roni_season = NOAA_SEASONS.get(int(last_roni_row["date_dt"].month), "ASO")
        roni_year = int(last_roni_row["date_dt"].year)
    else:
        last_roni = 0.0
        roni_season = None
        roni_year = None

    hist_month = zone_monthly[zone_monthly["date_dt"].dt.month == last_month_num]
    precip_hist_mean = hist_month["precip_mm"].dropna().mean()
    temp_hist_mean = hist_month["temp_c"].dropna().mean()
    sm_hist_mean = hist_month["soil_moisture"].dropna().mean()

    p_val = _opt_round(last_clim["precip_mm"], 2)
    t_val = _opt_round(last_clim["temp_c"], 2)
    sm_raw = last_clim["soil_moisture"]
    sm_val = round(min(1.0, max(0.0, float(sm_raw))), 4) if pd.notna(sm_raw) else None

    precip_anom_pct = (
        round(float((p_val - precip_hist_mean) / precip_hist_mean * 100.0), 1)
        if p_val is not None and pd.notna(precip_hist_mean) and precip_hist_mean > 1e-6
        else None
    )
    temp_anom_c = (
        round(float(t_val - temp_hist_mean), 2)
        if t_val is not None and pd.notna(temp_hist_mean)
        else None
    )
    sm_anom = (
        round(float(sm_val - sm_hist_mean), 4)
        if sm_val is not None and pd.notna(sm_hist_mean)
        else None
    )

    zone_climate = {
        "period": last_month,
        "precip_mm": p_val,
        "precip_anomaly_pct": precip_anom_pct,
        "temp_c": t_val,
        "temp_anomaly_c": temp_anom_c,
        "soil_moisture": sm_val,
        "soil_moisture_anomaly": sm_anom,
    }

    pumani_info = _load_pumani_zone_info()
    zone_obj = {
        **pumani_info,
        "climate": zone_climate,
    }

    now = _now_iso()
    result = {"generated_at": now, "scenarios": {}}

    for scenario in ["normal", "nino"]:
        if scenario == "nino":
            roni_block = {
                "value": round(last_roni, 3),
                "season": roni_season,
                "year": roni_year,
                "kind": "observed",
            }
        else:
            roni_block = {
                "value": 0.0,
                "season": None,
                "year": None,
                "kind": "assumed",
            }

        zone_with_roni = {**zone_obj, "roni": roni_block}

        sectors_out = []
        pred_list = sorted(
            [p for p in pred_raw["scenarios"][scenario] if p["zone_id"] == "pumani"],
            key=lambda x: _sector_sort_key(x["sector_id"]),
        )

        for pred in pred_list:
            sid = pred["sector_id"]
            feat = feat_by_id.get(("pumani", sid))
            if feat is None or not feat["properties"].get("display", False):
                continue

            p = feat["properties"]
            centroid = _make_centroid(feat)

            sec_monthly = pumani_monthly[pumani_monthly["sector_id"] == sid].sort_values("date_dt")
            sec_valid_ndvi = sec_monthly[sec_monthly["ndvi"].notna()]
            if len(sec_valid_ndvi) > 0:
                last_sec = sec_valid_ndvi.iloc[-1]
                ndvi_val = round(float(last_sec["ndvi"]), 4)
                veg_date = str(last_sec["date"])
                lm2 = int(last_sec["date_dt"].month)
                hist2 = sec_valid_ndvi[sec_valid_ndvi["date_dt"].dt.month == lm2]["ndvi"]
                if len(hist2) > 2 and hist2.std() > 1e-6:
                    ndvi_anom = round(float((ndvi_val - hist2.mean()) / hist2.std()), 4)
                else:
                    ndvi_anom = None
            else:
                ndvi_val = None
                ndvi_anom = None
                veg_date = last_month

            rest = restrend_raw.get(sid) or restrend_raw.get("sectors", {}).get(sid) or {
                "score": 0.5,
                "level": "medium",
                "confidence": 0.25,
                "confidence_label": "baja",
                "ndvi_residual": None,
            }

            rec = recommend(
                risk_level=pred["level"],
                risk_score=pred["score"],
                recovery_level=rest["level"],
                recovery_score=rest["score"],
                rotation_status=p["rotation_status"],
                rotation_years=int(p["rotation_years"]),
                scenario=scenario,
            )

            # En normal no hay precedente; en nino se elige el de mayor similarity
            twin_out = None
            if scenario == "nino":
                prec_list = [pr for pr in analogs_raw.get("precedents", []) if pr["sector_id"] == sid]
                if prec_list:
                    twin = max(prec_list, key=lambda x: (x.get("similarity", 0), x.get("event", "")))
                    twin_out = {
                        "sector_id": twin["sector_id"],
                        "twin_zone": twin["twin_zone"],
                        "twin_elevation_m": twin["twin_elevation_m"],
                        "twin_slope_pct": twin["twin_slope_pct"],
                        "similarity": twin["similarity"],
                        "event": twin["event"],
                        "observed_ndvi_anomaly": twin.get("observed_ndvi_anomaly"),
                        "confidence": twin["confidence"],
                        "confidence_label": twin["confidence_label"],
                        "is_simulated": twin["is_simulated"],
                    }

            sec_num = sid[1:] if sid.startswith("S") else sid
            sector_obj = {
                "id": sid,
                "name": f"Sector {sec_num}",
                "geometry": feat["geometry"],
                "centroid": centroid,
                "area_ha": round(float(p["area_ha"]), 2),
                "terrain": {
                    "elevation_m": _opt_round(p.get("elevation_m"), 1),
                    "slope_pct": _opt_round(p.get("slope_pct"), 2),
                    "aspect_deg": _opt_round(p.get("aspect_deg"), 1),
                },
                "rotation": {
                    "status": p["rotation_status"],
                    "years_in_status": int(p["rotation_years"]),
                    "is_simulated": True,
                },
                "vegetation": {
                    "date": veg_date,
                    "ndvi": ndvi_val,
                    "ndvi_anomaly": ndvi_anom,
                },
                "risk": {
                    "score": float(pred["score"]),
                    "level": pred["level"],
                    "interval": pred["interval"],
                    "confidence": float(pred["confidence"]),
                    "confidence_label": pred["confidence_label"],
                    "drivers": pred["drivers"],
                },
                "recovery": {
                    "score": float(rest["score"]),
                    "level": rest["level"],
                    "confidence": float(rest["confidence"]),
                    "confidence_label": rest["confidence_label"],
                    "ndvi_residual": rest.get("ndvi_residual"),
                },
                "recommendation": rec,
                "twin_precedent": twin_out,
                "is_simulated": True,
            }
            sectors_out.append(sector_obj)

        result["scenarios"][scenario] = {
            "updated_at": now,
            "data_source": data_source,
            "scenario": scenario,
            "zone": zone_with_roni,
            "sectors": sectors_out,
        }

    schema = _load_schema("sector_risk.schema.json")
    for sc, sc_data in result["scenarios"].items():
        _validate(sc_data, schema, f"predictions.json (scenario={sc})")

    out_path = os.path.join(output_dir, "predictions.json")
    _write_json_safe(result, out_path)
    return result


def build_history(input_dir: str, output_dir: str, data_source: str):
    """Genera y valida history.json antes de guardarlo."""
    mdf = pd.read_csv(os.path.join(input_dir, "monthly.csv"))
    gj = _load_json(os.path.join(input_dir, "sectors.geojson"))
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")

    display_sectors = sorted(
        [
            feat["properties"]["sector_id"]
            for feat in gj["features"]
            if feat["properties"]["zone_id"] == "pumani" and feat["properties"].get("display", False)
        ],
        key=_sector_sort_key,
    )

    pumani_mdf = mdf[mdf["zone_id"] == "pumani"].copy()
    from_date = str(pumani_mdf["date"].min())
    to_date = str(pumani_mdf["date"].max())
    now = _now_iso()
    schema = _load_schema("history.schema.json")

    sectors_data = {}
    for sid in display_sectors:
        sec_df = pumani_mdf[pumani_mdf["sector_id"] == sid].sort_values("date_dt")
        series = []
        for _, row in sec_df.iterrows():
            sm_raw = row["soil_moisture"]
            sm_val = round(min(1.0, max(0.0, float(sm_raw))), 4) if pd.notna(sm_raw) else None
            series.append({
                "date": str(row["date"]),
                "ndvi": _opt_round(row["ndvi"], 4),
                "precip_mm": _opt_round(row["precip_mm"], 2),
                "soil_moisture": sm_val,
                "temp_c": _opt_round(row["temp_c"], 2),
                "roni": _opt_round(row["roni"], 3),
            })

        sector_schema_obj = {
            "updated_at": now,
            "data_source": data_source,
            "sector_id": sid,
            "from": from_date,
            "to": to_date,
            "series": series,
        }
        _validate(sector_schema_obj, schema, f"history.json (sector={sid})")
        sectors_data[sid] = series

    out = {
        "generated_at": now,
        "data_source": data_source,
        "from": from_date,
        "to": to_date,
        "sectors": sectors_data,
    }
    out_path = os.path.join(output_dir, "history.json")
    _write_json_safe(out, out_path)
    return out


def build_backtests(input_dir: str, output_dir: str, data_source: str):
    """Genera y valida backtest_2015-16.json, backtest_2023-24.json y backtest_2020-22.json."""
    bt_raw = _load_json(os.path.join(output_dir, "backtests_raw.json"))
    schema = _load_schema("backtest.schema.json")
    now = _now_iso()

    validated = {}
    for event_key, bt in bt_raw.items():
        filename = f"backtest_{event_key}.json"
        out = {
            "updated_at": now,
            "data_source": data_source,
            "event": bt["event"],
            "event_type": bt["event_type"],
            "held_out": bt["held_out"],
            "zone": bt["zone"],
            "per_sector": bt["per_sector"],
            "per_sector_metric": bt["per_sector_metric"],
            "note": bt.get("note"),
        }
        _validate(out, schema, filename)
        validated[filename] = out

    for filename, out in validated.items():
        _write_json_safe(out, os.path.join(output_dir, filename))


def build_analogs(input_dir: str, output_dir: str, data_source: str):
    """Genera y valida analogs.json solo para sectores display=true de Pumani."""
    analogs_raw = _load_json(os.path.join(output_dir, "analogs_raw.json"))
    gj = _load_json(os.path.join(input_dir, "sectors.geojson"))
    schema = _load_schema("twin_precedent.schema.json")

    display_sectors = {
        feat["properties"]["sector_id"]
        for feat in gj["features"]
        if feat["properties"]["zone_id"] == "pumani" and feat["properties"].get("display", False)
    }

    precedents = [
        p for p in analogs_raw.get("precedents", [])
        if p["sector_id"] in display_sectors
    ]
    precedents.sort(key=lambda p: (_sector_sort_key(p["sector_id"]), p["event"]))

    for i, prec in enumerate(precedents):
        _validate(prec, schema, f"analogs.json[{i}]")

    out = {
        "generated_at": _now_iso(),
        "data_source": data_source,
        "precedents": precedents,
    }
    out_path = os.path.join(output_dir, "analogs.json")
    _write_json_safe(out, out_path)
    return out


def run(input_dir: str, output_dir: str):
    data_source = _detect_data_source(input_dir)
    print(f"  data_source: {data_source}")
    os.makedirs(output_dir, exist_ok=True)

    build_predictions(input_dir, output_dir, data_source)
    build_history(input_dir, output_dir, data_source)
    build_backtests(input_dir, output_dir, data_source)
    build_analogs(input_dir, output_dir, data_source)

    print(f"  Export completo en {output_dir}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="ml/data/fake")
    parser.add_argument("--output-dir", default="ml/outputs_fake")
    args = parser.parse_args()
    run(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
