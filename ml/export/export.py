"""
export.py — Genera los 6 JSON de salida y valida contra schemas de contracts/.
NOTA: Los schemas usan data_source="mock"|"real". Cuando input_dir contiene "fake",
se usa "mock" (compatible con el schema). Cuando contiene "interim", se usa "real".
"""
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

CONTRACTS_DIR = Path(__file__).parent.parent.parent / "contracts"


def _detect_data_source(input_dir: str) -> str:
    """mock si contiene 'fake', real si contiene 'interim', mock por defecto."""
    if "interim" in input_dir:
        return "real"
    return "mock"


def _load_schema(name: str) -> dict:
    path = CONTRACTS_DIR / name
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _validate(data: dict, schema: dict, label: str):
    """Valida data contra schema. Lanza excepción si falla."""
    try:
        import jsonschema
        # Draft 2020-12 / 2019-09 necesita validators específicos
        try:
            validator_cls = jsonschema.Draft202012Validator
        except AttributeError:
            validator_cls = jsonschema.Draft7Validator
        # Ignorar format validation para date-time (no siempre disponible)
        validator = validator_cls(schema, format_checker=None)
        errors = list(validator.iter_errors(data))
        if errors:
            msgs = "\n".join(str(e) for e in errors[:3])
            raise ValueError(f"Schema validation failed for {label}:\n{msgs}")
    except ImportError:
        print(f"  [WARN] jsonschema no disponible, omitiendo validación de {label}")


def _save(data: dict, path: str, schema: dict, label: str):
    _validate(data, schema, label)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  → {path}")


def _level(score: float) -> str:
    if score < 0.33:
        return "low"
    elif score < 0.66:
        return "medium"
    return "high"


def _conf_label(conf: float) -> str:
    if conf < 0.4:
        return "baja"
    elif conf < 0.7:
        return "media"
    return "alta"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_geojson(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_csv(path: str):
    import pandas as pd
    return pd.read_csv(path)


def _make_geometry(feature: dict) -> dict:
    return feature["geometry"]


def _make_centroid(feature: dict) -> dict:
    coords = feature["geometry"]["coordinates"][0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {"lat": round(sum(lats) / len(lats), 6), "lon": round(sum(lons) / len(lons), 6)}


def build_predictions(input_dir, output_dir, data_source):
    """Genera predictions.json."""
    pred_raw = _load_json(os.path.join(output_dir, "predictions_raw.json"))
    restrend_raw = _load_json(os.path.join(output_dir, "restrend_raw.json"))
    analogs_raw = _load_json(os.path.join(output_dir, "analogs_raw.json"))
    gj = _load_geojson(os.path.join(input_dir, "sectors.geojson"))
    mdf = _load_csv(os.path.join(input_dir, "monthly.csv"))

    import pandas as pd
    from ml.export.rules import recommend

    # Indexar features de geojson por (zone_id, sector_id)
    feat_by_id = {}
    for feat in gj["features"]:
        p = feat["properties"]
        feat_by_id[(p["zone_id"], p["sector_id"])] = feat

    # Última fecha del monthly para vegetación
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")
    last_date = mdf["date_dt"].max().strftime("%Y-%m")

    # Analogs indexados por (sector_id, event)
    analogs_idx = {}
    for prec in analogs_raw["precedents"]:
        key = (prec["sector_id"], prec["event"])
        analogs_idx[key] = prec

    # Roni actual de pumani (última observación)
    pumani_monthly = mdf[mdf["zone_id"] == "pumani"].sort_values("date_dt")
    last_roni = float(pumani_monthly["roni"].iloc[-1])
    last_month = pumani_monthly["date"].iloc[-1]
    last_year = int(pumani_monthly["date_dt"].iloc[-1].year)

    # Clima actual de pumani
    last_clim = pumani_monthly[pumani_monthly["date"] == last_month].iloc[0]
    # Anomalías (diferencia vs media histórica del mismo mes)
    month_num = pumani_monthly["date_dt"].dt.month
    last_month_num = int(last_clim["date_dt"].month)
    hist_month = pumani_monthly[month_num == last_month_num].iloc[:-1]
    precip_hist_mean = hist_month["precip_mm"].mean() if len(hist_month) > 0 else 60.0
    temp_hist_mean = hist_month["temp_c"].mean() if len(hist_month) > 0 else 8.0
    sm_hist_mean = hist_month["soil_moisture"].mean() if len(hist_month) > 0 else 0.3

    zone_climate = {
        "period": last_month,
        "precip_mm": round(float(last_clim["precip_mm"]), 2),
        "precip_anomaly_pct": round(float((last_clim["precip_mm"] - precip_hist_mean) / (precip_hist_mean + 1e-9) * 100), 1),
        "temp_c": round(float(last_clim["temp_c"]), 2),
        "temp_anomaly_c": round(float(last_clim["temp_c"] - temp_hist_mean), 2),
        "soil_moisture": round(min(1.0, max(0.0, float(last_clim["soil_moisture"]))), 4),
        "soil_moisture_anomaly": round(float(last_clim["soil_moisture"] - sm_hist_mean), 4),
    }

    zone_obj = {
        "id": "pumani",
        "name": "Pumani",
        "lat": -17.09,
        "lon": -68.00,
        "climate": zone_climate,
    }

    result = {"generated_at": _now_iso(), "scenarios": {}}

    for scenario in ["normal", "nino"]:
        roni_kind = "observed" if scenario == "nino" else "assumed"
        roni_val = last_roni if scenario == "nino" else 0.0

        zone_with_roni = {
            **zone_obj,
            "roni": {
                "value": round(roni_val, 3),
                "season": "ASO",
                "year": last_year,
                "kind": roni_kind,
            }
        }

        sectors_out = []
        pred_list = pred_raw["scenarios"][scenario]

        for pred in pred_list:
            if pred["zone_id"] != "pumani":
                continue

            sid = pred["sector_id"]
            feat = feat_by_id.get(("pumani", sid))
            if feat is None:
                continue

            if not feat["properties"].get("display", False):
                continue

            p = feat["properties"]
            geom = _make_geometry(feat)
            centroid = _make_centroid(feat)

            # Vegetación: último NDVI del sector
            sec_monthly = mdf[(mdf["zone_id"] == "pumani") & (mdf["sector_id"] == sid)]
            if len(sec_monthly) > 0:
                last_sec = sec_monthly.sort_values("date_dt").iloc[-1]
                ndvi_val = round(float(last_sec["ndvi"]), 4)
                # Anomalía: diferencia respecto al mes histórico
                sm2 = sec_monthly["date_dt"].dt.month
                lm2 = int(last_sec["date_dt"].month)
                hist2 = sec_monthly[sm2 == lm2].iloc[:-1]
                if len(hist2) > 1:
                    ndvi_mean = hist2["ndvi"].mean()
                    ndvi_std = hist2["ndvi"].std()
                    ndvi_anom = round(float((ndvi_val - ndvi_mean) / (ndvi_std + 1e-9)), 4) if ndvi_std > 0.001 else None
                else:
                    ndvi_anom = None
                veg_date = last_sec["date"]
            else:
                ndvi_val = None
                ndvi_anom = None
                veg_date = last_month

            # Restrend
            rest_key = sid
            rest = restrend_raw.get(rest_key, {
                "score": 0.5, "level": "medium",
                "confidence": 0.5, "confidence_label": "media", "ndvi_residual": 0.0
            })

            # Recomendación
            rec = recommend(
                risk_level=pred["level"],
                risk_score=pred["score"],
                recovery_level=rest["level"],
                recovery_score=rest["score"],
                rotation_status=p["rotation_status"],
                rotation_years=p["rotation_years"],
                scenario=scenario,
            )

            # Twin precedent: solo para escenario "nino" (null en escenario "normal")
            twin_out = None
            if scenario == "nino":
                prec_list = [p for p in analogs_raw.get("precedents", []) if p["sector_id"] == sid]
                if prec_list:
                    # Elegir el de mayor similarity
                    twin = max(prec_list, key=lambda x: x.get("similarity", 0))
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

            sector_obj = {
                "id": sid,
                "name": f"Sector {sid}",
                "geometry": geom,
                "centroid": centroid,
                "area_ha": float(p["area_ha"]),
                "terrain": {
                    "elevation_m": float(p["elevation_m"]),
                    "slope_pct": float(p["slope_pct"]),
                    "aspect_deg": float(p["aspect_deg"]),
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

        scenario_obj = {
            "updated_at": _now_iso(),
            "data_source": data_source,
            "scenario": scenario,
            "zone": zone_with_roni,
            "sectors": sectors_out,
        }
        result["scenarios"][scenario] = scenario_obj

    out_path = os.path.join(output_dir, "predictions.json")
    schema = _load_schema("sector_risk.schema.json")
    # Validar cada escenario por separado
    for sc, sc_data in result["scenarios"].items():
        _validate(sc_data, schema, f"predictions.json (scenario={sc})")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"  → {out_path}")
    return result


def build_history(input_dir, output_dir, data_source):
    """Genera history.json. Validamos cada sector contra history.schema."""
    mdf = _load_csv(os.path.join(input_dir, "monthly.csv"))
    gj = _load_geojson(os.path.join(input_dir, "sectors.geojson"))

    import pandas as pd
    mdf["date_dt"] = pd.to_datetime(mdf["date"] + "-01")

    # Solo sectores de pumani con display=true
    display_sectors = set()
    for feat in gj["features"]:
        p = feat["properties"]
        if p["zone_id"] == "pumani" and p.get("display", False):
            display_sectors.add(p["sector_id"])

    pumani_mdf = mdf[mdf["zone_id"] == "pumani"].copy()
    from_date = pumani_mdf["date"].min()
    to_date = pumani_mdf["date"].max()

    schema = _load_schema("history.schema.json")

    sectors_data = {}
    for sid in display_sectors:
        sec_df = pumani_mdf[pumani_mdf["sector_id"] == sid].sort_values("date_dt")
        series = []
        for _, row in sec_df.iterrows():
            sm = float(row["soil_moisture"])
            sm = round(min(1.0, max(0.0, sm)), 4)
            entry = {
                "date": row["date"],
                "ndvi": round(float(row["ndvi"]), 4),
                "precip_mm": round(float(row["precip_mm"]), 2),
                "soil_moisture": sm,
                "temp_c": round(float(row["temp_c"]), 2),
                "roni": round(float(row["roni"]), 3),
            }
            series.append(entry)

        # Validar cada sector contra el schema de endpoint
        sector_schema_obj = {
            "updated_at": _now_iso(),
            "data_source": data_source,
            "sector_id": sid,
            "from": from_date,
            "to": to_date,
            "series": series,
        }
        _validate(sector_schema_obj, schema, f"history/{sid}")
        sectors_data[sid] = series

    out = {
        "generated_at": _now_iso(),
        "data_source": data_source,
        "from": from_date,
        "to": to_date,
        "sectors": sectors_data,
    }

    out_path = os.path.join(output_dir, "history.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"  → {out_path}")
    return out


def build_backtests(input_dir, output_dir, data_source):
    """Genera los 3 archivos backtest_*.json."""
    bt_raw = _load_json(os.path.join(output_dir, "backtests_raw.json"))
    schema = _load_schema("backtest.schema.json")
    now = _now_iso()

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
        _save(out, os.path.join(output_dir, filename), schema, filename)


def build_analogs(input_dir, output_dir, data_source):
    """Genera analogs.json con lista de precedentes."""
    analogs_raw = _load_json(os.path.join(output_dir, "analogs_raw.json"))
    schema = _load_schema("twin_precedent.schema.json")

    precedents = analogs_raw["precedents"]
    # Validar cada precedente
    for i, prec in enumerate(precedents):
        _validate(prec, schema, f"analogs.json[{i}]")

    out = {
        "generated_at": _now_iso(),
        "data_source": data_source,
        "precedents": precedents,
    }
    out_path = os.path.join(output_dir, "analogs.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"  → {out_path}")
    return out


def run(input_dir, output_dir):
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
