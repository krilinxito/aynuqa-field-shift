"""
rules.py — Reglas fijas de recomendación de rotación comunal (aynuqa).

Siguen el ciclo documentado para Pumani por IBTA-ORSTOM (años 90): cada sector se cultiva 3 años
y descansa 10. Todo texto va en español simple y nunca afirma que habrá sequía como hecho seguro:
El Niño "aumenta la probabilidad de sequía", y solo se menciona en el escenario El Niño.
"""

CULTIVATION_YEARS = 3
REST_YEARS = 10
OPENING_CROP = "papa"  # en la aynuqa, el primer año después del descanso se siembra papa
SOWING_WINDOW = "octubre a noviembre"

LEVEL_ES = {"low": "bajo", "medium": "medio", "high": "alto"}
LEVEL_ES_FEM = {"low": "baja", "medium": "media", "high": "alta"}


def _drought_reason(risk_level: str, scenario: str) -> str:
    """Motivo de riesgo alto: El Niño solo en su escenario; en el normal, sin atribuirlo a El Niño."""
    if scenario == "nino":
        return "El Niño aumenta la probabilidad de sequía en esta campaña."
    return "El riesgo de sequía es alto en esta campaña."


def recommend(
    risk_level: str,
    risk_score: float,
    recovery_level: str,
    recovery_score: float,
    rotation_status: str,
    rotation_years: int,
    scenario: str,
) -> dict:
    """
    Genera la recomendación de manejo por sector según contracts/sector_risk.schema.json.

    Entradas:
        risk_level: 'low' | 'medium' | 'high'
        risk_score: 0.0 - 1.0
        recovery_level: 'low' | 'medium' | 'high'
        recovery_score: 0.0 - 1.0
        rotation_status: 'resting' | 'cultivated'
        rotation_years: años en ese estado (entero >= 0)
        scenario: 'normal' | 'nino'
    """
    extend_rest_years = None
    crop = None
    sowing_window = None
    riesgo_es = LEVEL_ES.get(risk_level, "medio")
    recup_es = LEVEL_ES_FEM.get(recovery_level, "media")
    high_risk = risk_level == "high"

    if rotation_status == "cultivated":
        if rotation_years >= CULTIVATION_YEARS:
            action = "start_rest"
            text = "Pasar este sector a descanso cuando termine la cosecha."
            reasons = [
                f"Ya lleva {rotation_years} años seguidos de cultivo, el ciclo completo de la aynuqa.",
                "El suelo necesita descansar para recuperar su fertilidad.",
            ]
            if high_risk:
                reasons.append(_drought_reason(risk_level, scenario))
        else:
            action = "keep_cultivating"
            text = "Seguir cultivando este sector un año más."
            reasons = [
                f"Lleva {rotation_years} año(s) de cultivo; el ciclo de la aynuqa es de {CULTIVATION_YEARS} años.",
            ]
            if high_risk:
                reasons.append(_drought_reason(risk_level, scenario))
                reasons.append("Conviene cuidar la humedad del suelo.")
            else:
                reasons.append(f"El riesgo de sequía es {riesgo_es}.")

    else:  # resting
        if rotation_years < REST_YEARS:
            action = "extend_rest"
            extend_rest_years = REST_YEARS - rotation_years
            text = "Mantener este sector en descanso."
            reasons = [
                f"Lleva {rotation_years} año(s) de descanso; el ciclo de la aynuqa es de {REST_YEARS} años.",
                f"Le faltan {extend_rest_years} año(s) para completar el descanso.",
            ]
        elif high_risk:
            action = "extend_rest"
            extend_rest_years = 1
            text = "Alargar el descanso un año más antes de abrir este sector."
            reasons = [
                f"Ya completó {rotation_years} años de descanso.",
                _drought_reason(risk_level, scenario),
                "Esperar un año reduce el riesgo de perder la primera siembra.",
            ]
        elif recovery_level == "low":
            action = "extend_rest"
            extend_rest_years = 1
            text = "Alargar el descanso un año más antes de abrir este sector."
            reasons = [
                f"Ya completó {rotation_years} años de descanso.",
                "La recuperación del suelo todavía es baja comparada con otros sectores.",
            ]
        else:
            action = "open"
            crop = OPENING_CROP
            sowing_window = SOWING_WINDOW
            text = "Se puede abrir este sector para cultivo."
            reasons = [
                f"Completó {rotation_years} años de descanso y la recuperación del suelo es {recup_es}.",
                f"El riesgo de sequía es {riesgo_es}.",
                f"Como es costumbre en la aynuqa, el primer año se siembra {crop} (de {sowing_window}).",
            ]

    if rotation_status == "resting":
        base_conf = (recovery_score + (1.0 - risk_score)) / 2.0
    else:
        base_conf = max(0.5, 1.0 - risk_score)
    if high_risk:
        base_conf = min(base_conf, 0.65)

    base_conf = round(float(max(0.0, min(1.0, base_conf))), 4)
    if base_conf < 0.4:
        confidence_label = "baja"
    elif base_conf <= 0.7:
        confidence_label = "media"
    else:
        confidence_label = "alta"

    return {
        "action": action,
        "text": text,
        "reasons": reasons,
        "extend_rest_years": extend_rest_years,
        "crop": crop,
        "sowing_window": sowing_window,
        "confidence": base_conf,
        "confidence_label": confidence_label,
    }
