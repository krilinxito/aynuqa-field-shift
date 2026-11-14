"""Reporte imprimible para la asamblea.

No calcula nada nuevo: ordena y presenta la recomendación que ya viene en
predictions.json. El formato Markdown/HTML es un extra fuera de contracts/.
"""

from __future__ import annotations

from html import escape
from typing import Any

ACTION_TEXT = {
    "open": "abrir para cultivo",
    "extend_rest": "alargar el descanso",
    "start_rest": "pasar a descanso",
    "keep_cultivating": "seguir cultivando",
}

LEVEL_TEXT = {"low": "bajo", "medium": "medio", "high": "alto"}
SCENARIO_TEXT = {
    "nino": "El Niño (estado real de hoy)",
    "normal": "Año normal (comparación)",
}


def render_report(
    payload: dict[str, Any],
    scenario: str,
    report_format: str = "md",
) -> str:
    title, intro, sections = _build(payload, scenario)
    if report_format == "html":
        return _render_html(title, intro, sections)
    return _render_markdown(title, intro, sections)


def _build(
    payload: dict[str, Any],
    scenario: str,
) -> tuple[str, list[str], list[tuple[str, list[str]]]]:
    zone = payload.get("zone", {})
    climate = zone.get("climate", {})
    roni = zone.get("roni", {})
    sectors = payload.get("sectors", [])
    data_source = payload.get("data_source", "mock")

    title = f"Reporte para la asamblea — {zone.get('name', 'la comunidad')}"
    intro = [
        f"Escenario: {SCENARIO_TEXT.get(scenario, scenario)}.",
        f"Actualizado: {payload.get('updated_at', 'sin fecha')}.",
        f"Origen de los datos: {'real' if data_source == 'real' else 'mock (datos de ejemplo)'}.",
    ]

    climate_lines = [
        f"Periodo: {climate.get('period', 'sin dato')}.",
        _number_line("Lluvia del mes", climate.get("precip_mm"), "mm"),
        _number_line("Temperatura media", climate.get("temp_c"), "°C"),
        _soil_line(climate.get("soil_moisture")),
        _roni_line(roni),
    ]

    open_lines: list[str] = []
    rest_lines: list[str] = []
    crop_lines: list[str] = []
    risk_lines: list[str] = []
    twin_lines: list[str] = []

    for sector in sectors:
        recommendation = sector.get("recommendation", {})
        action = recommendation.get("action")
        sector_line = (
            f"{sector.get('id')} — {sector.get('name', '')}: "
            f"{recommendation.get('text', 'Sin recomendación.')} "
            f"(acción: {ACTION_TEXT.get(action, action)}; "
            f"confianza: {recommendation.get('confidence_label', 'sin dato')})."
        )
        if action in ("open", "keep_cultivating"):
            open_lines.append(sector_line)
        elif action in ("extend_rest", "start_rest"):
            rest_lines.append(sector_line)

        crop = recommendation.get("crop")
        sowing_window = recommendation.get("sowing_window")
        if crop or sowing_window:
            crop_lines.append(
                f"{sector.get('id')}: cultivo {crop or 'no definido'}; "
                f"ventana de siembra {sowing_window or 'no definida'}."
            )

        risk = sector.get("risk", {})
        recovery = sector.get("recovery", {})
        risk_lines.append(
            f"{sector.get('id')}: riesgo de sequía "
            f"{LEVEL_TEXT.get(risk.get('level'), risk.get('level', 'sin dato'))} "
            f"({_score(risk.get('score'))}); recuperación "
            f"{LEVEL_TEXT.get(recovery.get('level'), recovery.get('level', 'sin dato'))} "
            f"({_score(recovery.get('score'))}); recomendación con confianza "
            f"{recommendation.get('confidence_label', 'sin dato')}."
        )

        twin = sector.get("twin_precedent")
        if twin:
            anomaly = twin.get("observed_ndvi_anomaly")
            anomaly_text = (
                f"{anomaly:+.2f} desviaciones estándar de lo normal"
                if isinstance(anomaly, (int, float))
                else "un dato de NDVI no disponible"
            )
            twin_lines.append(
                f"{sector.get('id')}: en {twin.get('twin_zone')}, durante El Niño "
                f"{twin.get('event')}, el NDVI observado estuvo {anomaly_text} "
                f"(parecido {_score(twin.get('similarity'))}). "
                "Es un precedente, no una garantía."
            )

    honesty = [
        "Los límites de los sectores y los años de descanso son simulados.",
        "El Niño aumenta la probabilidad de sequía; no la asegura.",
        "No hay datos reales de rendimiento de cultivos a esta escala.",
        "La asamblea decide; este reporte solo aporta evidencia.",
    ]
    if data_source != "real":
        honesty.insert(0, "Este reporte usa datos de ejemplo (mock).")

    sections = [
        ("Clima de la zona", climate_lines),
        ("Sectores para abrir", open_lines),
        ("Sectores que deben descansar", rest_lines),
        ("Qué sembrar y cuándo", crop_lines),
        ("Riesgo, recuperación y confianza", risk_lines),
        ("Precedente de tierra gemela", twin_lines),
        ("Nota de honestidad", honesty),
    ]
    return title, intro, sections


def _render_markdown(
    title: str,
    intro: list[str],
    sections: list[tuple[str, list[str]]],
) -> str:
    lines = [f"# {title}", ""]
    lines.extend(intro)
    lines.append("")
    for section_title, items in sections:
        lines.append(f"## {section_title}")
        if items:
            lines.extend(f"- {item}" for item in items)
        else:
            lines.append("- No hay datos en esta sección.")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def _render_html(
    title: str,
    intro: list[str],
    sections: list[tuple[str, list[str]]],
) -> str:
    parts = [
        "<!doctype html>",
        '<html lang="es">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f"<title>{escape(title)}</title>",
        "<style>",
        "body{font-family:system-ui,sans-serif;max-width:820px;margin:2rem auto;"
        "padding:0 1rem;line-height:1.55;color:#1f2937}",
        "h1{font-size:1.8rem;margin-bottom:.5rem}",
        "h2{font-size:1.2rem;margin-top:1.6rem;border-bottom:1px solid #d1d5db;"
        "padding-bottom:.25rem}",
        "ul{padding-left:1.2rem}li{margin:.35rem 0}",
        "@media print{body{margin:0}p{orphans:3;widows:3}}",
        "</style>",
        "</head>",
        "<body>",
        f"<h1>{escape(title)}</h1>",
    ]
    parts.extend(f"<p>{escape(line)}</p>" for line in intro)
    for section_title, items in sections:
        parts.append(f"<h2>{escape(section_title)}</h2>")
        if items:
            parts.append("<ul>")
            parts.extend(f"<li>{escape(item)}</li>" for item in items)
            parts.append("</ul>")
        else:
            parts.append("<p>No hay datos en esta sección.</p>")
    parts.extend(["</body>", "</html>"])
    return "\n".join(parts)


def _number_line(label: str, value: Any, unit: str) -> str:
    if not isinstance(value, (int, float)):
        return f"{label}: sin dato."
    return f"{label}: {value:.1f} {unit}."


def _soil_line(value: Any) -> str:
    if not isinstance(value, (int, float)):
        return "Humedad de suelo: sin dato."
    return f"Humedad de suelo: {value * 100:.0f} % de la fracción 0 a 1."


def _roni_line(roni: dict[str, Any]) -> str:
    value = roni.get("value")
    if not isinstance(value, (int, float)):
        return "RONI: sin dato."
    kind = roni.get("kind", "sin dato")
    return f"RONI: {value:+.2f} ({kind})."


def _score(value: Any) -> str:
    if not isinstance(value, (int, float)):
        return "sin dato"
    return f"{value:.2f}"
