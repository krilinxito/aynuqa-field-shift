"""
rules.py — Reglas fijas de recomendación de rotación.
Nunca afirmar que habrá sequía; usar lenguaje probabilístico.
"""


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
    Genera recomendación de manejo agrícola.

    Args:
        risk_level: 'low' | 'medium' | 'high'
        risk_score: 0.0 - 1.0
        recovery_level: 'low' | 'medium' | 'high'
        recovery_score: 0.0 - 1.0
        rotation_status: 'resting' | 'cultivated'
        rotation_years: años en el estado actual (entero >= 0)
        scenario: 'normal' | 'nino'

    Returns:
        dict con action, text, reasons, extend_rest_years, crop, sowing_window, confidence, confidence_label
    """
    action = None
    text = ""
    reasons = []
    extend_rest_years = None
    crop = None
    sowing_window = None

    if rotation_status == "cultivated":
        if rotation_years >= 3:
            action = "start_rest"
            text = (
                "El sector lleva suficiente tiempo cultivado. "
                "Es momento de iniciar un período de descanso para recuperar el suelo."
            )
            reasons = [
                f"El sector lleva {rotation_years} años cultivado (≥ 3 años).",
                "El descanso ayuda a recuperar la fertilidad y reducir la erosión.",
            ]
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía, lo que hace más importante descansar ahora."
                )
        else:
            action = "keep_cultivating"
            text = (
                f"El sector lleva {rotation_years} año(s) cultivado. "
                "Puede continuar cultivando hasta completar el ciclo recomendado de 3 años."
            )
            reasons = [
                f"El sector lleva {rotation_years} año(s) cultivado (< 3 años).",
                "Continuar cultivando hasta completar el ciclo.",
            ]
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía. "
                    "Considere medidas de conservación de humedad."
                )

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
            # Cultivo según paridad de rotation_years
            crop = "papa" if rotation_years % 2 == 0 else "quinua"
            sowing_window = "octubre a noviembre"
            text = (
                f"El suelo ha descansado {rotation_years} años y muestra buena recuperación. "
                f"Se recomienda abrir el sector para cultivar {crop} en la ventana de siembra de {sowing_window}."
            )
            reasons = [
                f"Recuperación del suelo: nivel {recovery_level} (score {recovery_score:.2f}).",
                f"El sector lleva {rotation_years} años en descanso (≥ 8 años).",
                f"Riesgo de sequía: {risk_level} (score {risk_score:.2f}).",
                f"Cultivo recomendado: {crop}.",
            ]

        elif can_open_nino_high:
            action = "extend_rest"
            extend_rest_years = 1
            text = (
                f"El suelo está recuperado después de {rotation_years} años, "
                "pero el escenario El Niño aumenta la probabilidad de sequía. "
                "Se recomienda extender el descanso 1 año más."
            )
            reasons = [
                f"Recuperación del suelo: nivel {recovery_level} (score {recovery_score:.2f}).",
                f"El sector lleva {rotation_years} años en descanso (≥ 8 años).",
                "El Niño aumenta la probabilidad de sequía; abrir ahora tiene mayor riesgo.",
                "Se recomienda esperar 1 año antes de cultivar.",
            ]

        else:
            # No cumple condición de apertura
            years_to_wait = max(1, 8 - rotation_years)
            action = "extend_rest"
            extend_rest_years = years_to_wait
            text = (
                f"El sector lleva {rotation_years} años en descanso y aún no cumple las condiciones "
                f"para abrir. Se recomienda extender el descanso {years_to_wait} año(s) más."
            )
            reasons = []
            if rotation_years < 8:
                reasons.append(
                    f"El sector lleva {rotation_years} años en descanso (mínimo recomendado: 8 años)."
                )
            if recovery_level != "high":
                reasons.append(
                    f"Recuperación del suelo insuficiente: nivel {recovery_level} (score {recovery_score:.2f})."
                )
            if risk_level == "high":
                reasons.append(
                    "El Niño aumenta la probabilidad de sequía; abrir ahora es arriesgado."
                )
            if not reasons:
                reasons.append("No se cumplen todas las condiciones para abrir el sector.")
            reasons.append(f"Se recomienda extender el descanso {years_to_wait} año(s).")

    # Confianza: combina recovery_score y (1 - risk_score)
    if rotation_status == "resting":
        base_conf = (recovery_score + (1 - risk_score)) / 2
    else:
        base_conf = max(0.5, 1 - risk_score)

    # Ajuste por escenario
    if scenario == "nino" and risk_level == "high":
        base_conf = min(base_conf, 0.65)

    base_conf = round(float(max(0.0, min(1.0, base_conf))), 4)
    if base_conf < 0.4:
        confidence_label = "baja"
    elif base_conf < 0.7:
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
