"""Carga los archivos de ML en SQLite, con fallback transparente a los mocks.

Reglas del README:
- Si el archivo real existe y cumple el schema, se usa (`real`).
- Si falta o no valida, se usa el ejemplo de `contracts/` (`mock`).
- `GET` siempre lee de SQLite, nunca del archivo.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from jsonschema import Draft202012Validator

from app.config import Settings
from app.db import Database
from app.utils import iso_now

logger = logging.getLogger(__name__)

BACKTEST_EVENTS = ("2015-16", "2023-24", "2020-22")


@dataclass
class LoadResult:
    sources: dict[str, str]
    updated_at: str
    warnings: list[str] = field(default_factory=list)


class MLLoader:
    def __init__(self, settings: Settings, db: Database) -> None:
        self.settings = settings
        self.db = db
        self.mock_dir = settings.contracts / "examples" / "ml_outputs"
        self.validators = self._load_validators()

    def _load_validators(self) -> dict[str, Draft202012Validator]:
        validators: dict[str, Draft202012Validator] = {}
        for name in ("sector_risk", "history", "backtest", "twin_precedent"):
            path = self.settings.contracts / f"{name}.schema.json"
            if not path.is_file():
                raise RuntimeError(
                    f"No se encontró el contrato {path}. "
                    "Revisa CONTRACTS_DIR o el merge de contracts/."
                )
            schema = json.loads(path.read_text(encoding="utf-8"))
            Draft202012Validator.check_schema(schema)
            validators[name] = Draft202012Validator(schema)
        return validators

    def _errors(self, instance: Any, schema_name: str) -> list[str]:
        validator = self.validators[schema_name]
        return [
            f"{'/'.join(map(str, error.absolute_path))}: {error.message}"
            for error in validator.iter_errors(instance)
        ]

    def _read_json(self, path: Path, warnings: list[str]) -> Any | None:
        if not path.is_file():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            warnings.append(f"{path}: no se pudo leer ({exc})")
            return None

    def _load_predictions_file(
        self, path: Path, source: str, warnings: list[str]
    ) -> dict[str, Any] | None:
        wrapper = self._read_json(path, warnings)
        if wrapper is None:
            return None
        if not isinstance(wrapper, dict) or set(wrapper) != {"generated_at", "scenarios"}:
            warnings.append(f"{path.name}: se esperaba {{generated_at, scenarios}}")
            return None
        scenarios = wrapper.get("scenarios")
        if not isinstance(scenarios, dict) or set(scenarios) != {"normal", "nino"}:
            warnings.append(f"{path.name}: faltan los escenarios normal y nino")
            return None
        result: dict[str, Any] = {}
        updated_values: list[str] = [wrapper["generated_at"]]
        for scenario in ("normal", "nino"):
            response = scenarios[scenario]
            errors = self._errors(response, "sector_risk")
            if errors:
                warnings.append(f"{path.name}/{scenario}: {'; '.join(errors[:3])}")
                return None
            if response.get("scenario") != scenario:
                warnings.append(f"{path.name}/{scenario}: el campo scenario no coincide")
                return None
            response = dict(response)
            response["data_source"] = source
            result[scenario] = response
            updated_values.append(response.get("updated_at", wrapper["generated_at"]))
        return {
            "scenarios": result,
            "updated_at": _max_iso(updated_values),
        }

    def _load_history_file(
        self, path: Path, source: str, warnings: list[str]
    ) -> dict[str, Any] | None:
        wrapper = self._read_json(path, warnings)
        if wrapper is None:
            return None
        expected = {"generated_at", "data_source", "from", "to", "sectors"}
        if not isinstance(wrapper, dict) or set(wrapper) != expected:
            warnings.append(
                f"{path.name}: se esperaba {{generated_at, data_source, from, to, sectors}}"
            )
            return None
        sectors = wrapper.get("sectors")
        if not isinstance(sectors, dict) or not sectors:
            warnings.append(f"{path.name}: no trae sectores")
            return None
        normalized: dict[str, list[dict[str, Any]]] = {}
        reference: list[tuple[Any, ...]] | None = None
        for sector_id, series in sectors.items():
            if not isinstance(series, list):
                warnings.append(f"{path.name}/{sector_id}: la serie no es una lista")
                return None
            response = {
                "updated_at": wrapper["generated_at"],
                "data_source": source,
                "sector_id": sector_id,
                "from": wrapper["from"],
                "to": wrapper["to"],
                "series": series,
            }
            errors = self._errors(response, "history")
            if errors:
                warnings.append(f"{path.name}/{sector_id}: {'; '.join(errors[:3])}")
                return None
            zone_values = [
                (
                    row.get("precip_mm"),
                    row.get("soil_moisture"),
                    row.get("temp_c"),
                    row.get("roni"),
                )
                for row in series
            ]
            if reference is None:
                reference = zone_values
            elif zone_values != reference:
                warnings.append(
                    f"{path.name}: el clima de la zona cambia entre sectores"
                )
                return None
            normalized[sector_id] = sorted(series, key=lambda row: row["date"])
        return {
            "updated_at": wrapper["generated_at"],
            "data_source": source,
            "from": wrapper["from"],
            "to": wrapper["to"],
            "sectors": normalized,
        }

    def _load_backtest_file(
        self, path: Path, source: str, event: str, warnings: list[str]
    ) -> dict[str, Any] | None:
        data = self._read_json(path, warnings)
        if data is None:
            return None
        errors = self._errors(data, "backtest")
        if errors:
            warnings.append(f"{path.name}: {'; '.join(errors[:3])}")
            return None
        if data.get("event") != event:
            warnings.append(f"{path.name}: el evento no coincide con el nombre")
            return None
        data = dict(data)
        data["data_source"] = source
        return data

    def _load_analogs_file(
        self, path: Path, source: str, warnings: list[str]
    ) -> dict[str, Any] | None:
        wrapper = self._read_json(path, warnings)
        if wrapper is None:
            return None
        if not isinstance(wrapper, dict) or set(wrapper) != {
            "generated_at",
            "data_source",
            "precedents",
        }:
            warnings.append(
                f"{path.name}: se esperaba {{generated_at, data_source, precedents}}"
            )
            return None
        precedents = wrapper.get("precedents")
        if not isinstance(precedents, list) or not precedents:
            warnings.append(f"{path.name}: no trae precedentes")
            return None
        seen: set[tuple[str, str]] = set()
        for precedent in precedents:
            errors = self._errors(precedent, "twin_precedent")
            if errors:
                warnings.append(f"{path.name}: {'; '.join(errors[:3])}")
                return None
            key = (precedent["sector_id"], precedent["event"])
            if key in seen:
                warnings.append(f"{path.name}: precedente duplicado {key}")
                return None
            seen.add(key)
        return {
            "updated_at": wrapper["generated_at"],
            "data_source": source,
            "precedents": precedents,
        }

    def _load_group(
        self,
        group: str,
        filename: str,
        loader: Callable[[Path, str, list[str]], dict[str, Any] | None],
        warnings: list[str],
    ) -> tuple[dict[str, Any], str]:
        real_path = self.settings.ml_outputs / filename
        if real_path.is_file():
            data = loader(real_path, "real", warnings)
            if data is not None:
                logger.info("Cargando %s real desde %s", group, real_path)
                return data, "real"
            warnings.append(f"{group}: el archivo real no es válido; se usa mock")
        mock_path = self.mock_dir / filename
        data = loader(mock_path, "mock", warnings)
        if data is None:
            raise RuntimeError(
                f"No se pudo cargar {group}: ni el archivo real ni el mock son válidos. "
                f"Revisa {mock_path}."
            )
        logger.warning("Cargando %s desde mock %s", group, mock_path)
        return data, "mock"

    def _load_backtests(
        self, warnings: list[str]
    ) -> tuple[dict[str, dict[str, Any]], str]:
        real: dict[str, dict[str, Any]] = {}
        all_real = True
        for event in BACKTEST_EVENTS:
            path = self.settings.ml_outputs / f"backtest_{event}.json"
            if not path.is_file():
                all_real = False
                break
            data = self._load_backtest_file(path, "real", event, warnings)
            if data is None:
                all_real = False
                break
            real[event] = data
        if all_real:
            logger.info("Cargando backtest real para %s", ", ".join(BACKTEST_EVENTS))
            return real, "real"

        mock: dict[str, dict[str, Any]] = {}
        for event in BACKTEST_EVENTS:
            path = self.mock_dir / f"backtest_{event}.json"
            data = self._load_backtest_file(path, "mock", event, warnings)
            if data is None:
                raise RuntimeError(
                    f"No se pudo cargar el backtest mock {path}. Revisa contracts/."
                )
            mock[event] = data
        logger.warning("Cargando backtest desde mocks de contracts/")
        return mock, "mock"

    def load_all(self) -> LoadResult:
        warnings: list[str] = []
        predictions, predictions_source = self._load_group(
            "predictions", "predictions.json", self._load_predictions_file, warnings
        )
        history, history_source = self._load_group(
            "history", "history.json", self._load_history_file, warnings
        )
        backtests, backtest_source = self._load_backtests(warnings)
        analogs, analogs_source = self._load_group(
            "analogs", "analogs.json", self._load_analogs_file, warnings
        )

        sources = {
            "predictions": predictions_source,
            "history": history_source,
            "backtest": backtest_source,
            "analogs": analogs_source,
        }
        updated_at = _max_iso(
            [
                predictions["updated_at"],
                history["updated_at"],
                analogs["updated_at"],
                *[payload["updated_at"] for payload in backtests.values()],
            ]
        )
        self.db.replace_dataset(
            predictions=predictions["scenarios"],
            history=history,
            backtests=backtests,
            analogs=analogs["precedents"],
            sources=sources,
            updated_at=updated_at,
        )
        if warnings:
            for warning in warnings:
                logger.warning("ML loader: %s", warning)
        logger.info(
            "Datos cargados: predictions=%s, history=%s, backtest=%s, analogs=%s",
            predictions_source,
            history_source,
            backtest_source,
            analogs_source,
        )
        return LoadResult(sources=sources, updated_at=updated_at, warnings=warnings)


def _max_iso(values: list[str]) -> str:
    parsed: list[datetime] = []
    for value in values:
        if not value:
            continue
        try:
            parsed.append(datetime.fromisoformat(value))
        except (TypeError, ValueError):
            continue
    if not parsed:
        return iso_now()
    try:
        latest = max(parsed)
    except TypeError:
        return parsed[-1].isoformat(timespec="seconds")
    return latest.isoformat(timespec="seconds")
