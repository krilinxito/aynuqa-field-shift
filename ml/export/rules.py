"""
rules.py — Reglas fijas de recomendación de rotación comunal (aynuqa).
Todo texto va en español simple y nunca afirma que habrá sequía como hecho seguro:
El Niño "aumenta la probabilidad de sequía".
"""

LEVEL_ES = {
    "low": "bajo",
    "medium": "medio",
    "high": "alto",
}


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
    action = None
    text = ""
    reasons = []
    extend_rest_years = None
    crop = None
    sowing_window = None

    riesgo_es = LEVEL_ES.get(risk_level, "medio")
    recup_es = LEVEL_ES.get(recovery_level, "media")
    recup_femenino = {"bajo": "baja", "medio": "media", "alto": "alta"}.get(riesgo_es if False else recup_es, "media")

    if rotation_status == "cultivated":
        if rotation_years >= 3:
            action = "start_rest"
            text = "Pasar este sector a descanso cuando termine la cosecha."
            reasons = [
                f"Ya lleva {rotation_years} años seguidos de cultivo.",
                "El suelo necesita entrar en descanso para recuperar su fertilidad.",
            ]
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía, por lo que conviene iniciar el descanso."
                )
        else:
            action = "keep_cultivating"
            text = "Seguir cultivando este sector un año más."
            reasons = [
                f"Lleva {rotation_years} año(s) de cultivo, dentro del ciclo habitual de 3 años.",
            ]
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía; se recomienda cuidar la humedad del suelo."
                )
            else:
                reasons.append(f"El riesgo de sequía es {riesgo_es}.")

    elif rotation_status == "resting":
        can_open = (
            recovery_level == "high"
            and rotation_years >= 8
            and risk_level != "high"
        )
        can_open_nino_high = (
            recovery_level == "high"
            and rotation_years >= 8
            and risk_level == "high"
            and scenario == "nino"
        )

        if can_open:
            action = "open"
            crop = "papa" if rotation_years % 2 == 0 else "quinua"
            sowing_window = "octubre a noviembre"
            text = "Se puede abrir este sector para cultivo."
            reasons = [
                f"Descansó {rotation_years} años y la recuperación del suelo es {recup_femenino}.",
                f"El riesgo de sequía es {riesgo_es}.",
                f"Cultivo sugerido: {crop} (siembra de {sowing_window}).",
            ]

        elif can_open_nino_high:
            action = "extend_rest"
            extend_rest_years = 1
            text = "Alargar el descanso un año más antes de abrir este sector."
            reasons = [
                f"Descansó {rotation_years} años y el suelo ya muestra buena recuperación.",
                "El Niño aumenta la probabilidad de sequía en esta campaña.",
                "Esperar 1 año reduce el riesgo de perder la primera siembra.",
            ]

        else:
            years_to_wait = max(1, 8 - rotation_years)
            action = "extend_rest"
            extend_rest_years = years_to_wait
            text = "Mantener este sector en descanso."
            reasons = []
            if rotation_years < 8:
                reasons.append(
                    f"Lleva {rotation_years} año(s) de descanso y aún no completa el ciclo recomendado."
                )
            if recovery_level != "high":
                reasons.append(
                    f"La recuperación del suelo todavía es {recup_femenino}."
                )
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía en esta campaña."
                )
            reasons.append(f"Se sugiere alargar el descanso {years_to_wait} año(s) más.")

    if rotation_status == "resting":
        base_conf = (recovery_score + (1.0 - risk_score)) / 2.0
    else:
        base_conf = max(0.5, 1.0 - risk_score)

    if scenario == "nino" and risk_level == "high":
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
