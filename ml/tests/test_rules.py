"""
test_rules.py — Tests de las reglas de recomendación.
"""
import pytest
from ml.export.rules import recommend


# --- Tests de las 4 acciones ---

def test_start_rest():
    r = recommend("high", 0.8, "low", 0.2, "cultivated", 4, "nino")
    assert r["action"] == "start_rest"
    assert r["extend_rest_years"] is None
    assert r["crop"] is None
    assert r["sowing_window"] is None


def test_keep_cultivating():
    r = recommend("low", 0.1, "medium", 0.5, "cultivated", 2, "normal")
    assert r["action"] == "keep_cultivating"
    assert r["extend_rest_years"] is None


def test_open_papa():
    # rotation_years=8 (par) → papa
    r = recommend("low", 0.2, "high", 0.9, "resting", 8, "normal")
    assert r["action"] == "open"
    assert r["crop"] == "papa"
    assert r["sowing_window"] is not None
    assert "octubre" in r["sowing_window"].lower() or "noviembre" in r["sowing_window"].lower()


def test_open_quinua():
    # rotation_years=9 (impar) → quinua
    r = recommend("low", 0.2, "high", 0.9, "resting", 9, "normal")
    assert r["action"] == "open"
    assert r["crop"] == "quinua"


def test_extend_rest_nino_high():
    # resting, high recovery, >= 8 años, risk=high, scenario=nino → extend_rest 1 año
    r = recommend("high", 0.8, "high", 0.9, "resting", 10, "nino")
    assert r["action"] == "extend_rest"
    assert r["extend_rest_years"] == 1


def test_extend_rest_not_enough_years():
    # Solo 4 años de descanso → debe extender
    r = recommend("low", 0.2, "medium", 0.5, "resting", 4, "normal")
    assert r["action"] == "extend_rest"
    assert r["extend_rest_years"] == max(1, 8 - 4)


def test_extend_rest_low_recovery():
    # 9 años de descanso pero recovery=low → no puede abrir
    r = recommend("low", 0.1, "low", 0.1, "resting", 9, "normal")
    assert r["action"] == "extend_rest"


# --- Casos borde ---

def test_zero_rotation_years_cultivated():
    r = recommend("low", 0.2, "medium", 0.5, "cultivated", 0, "normal")
    assert r["action"] == "keep_cultivating"


def test_exactly_3_years_cultivated():
    r = recommend("low", 0.1, "low", 0.1, "cultivated", 3, "normal")
    assert r["action"] == "start_rest"


def test_resting_exactly_8_years_high_recovery_normal():
    r = recommend("medium", 0.5, "high", 0.85, "resting", 8, "normal")
    assert r["action"] == "open"


def test_confidence_range():
    for status in ["cultivated", "resting"]:
        for rl in ["low", "medium", "high"]:
            for rc in ["low", "medium", "high"]:
                for sc in ["normal", "nino"]:
                    r = recommend(rl, 0.5, rc, 0.5, status, 5, sc)
                    assert 0.0 <= r["confidence"] <= 1.0, f"confidence out of range: {r['confidence']}"
                    assert r["confidence_label"] in ("baja", "media", "alta")


def test_reasons_not_empty():
    r = recommend("high", 0.8, "low", 0.1, "resting", 3, "nino")
    assert len(r["reasons"]) >= 1


# --- Que el texto no diga "habrá sequía" ---

ALL_COMBINATIONS = [
    ("low", 0.1, "low", 0.1, "cultivated", 1, "normal"),
    ("high", 0.9, "high", 0.9, "cultivated", 5, "nino"),
    ("low", 0.1, "high", 0.9, "resting", 10, "normal"),
    ("high", 0.9, "high", 0.9, "resting", 10, "nino"),
    ("high", 0.9, "low", 0.1, "resting", 2, "nino"),
    ("medium", 0.5, "medium", 0.5, "resting", 8, "normal"),
]


@pytest.mark.parametrize("args", ALL_COMBINATIONS)
def test_no_sequía_afirmativa(args):
    r = recommend(*args)
    texto_completo = r["text"] + " ".join(r["reasons"])
    # No debe afirmar que habrá sequía (solo probabilidad)
    frases_prohibidas = [
        "habrá sequía",
        "habrá una sequía",
        "ocurrirá sequía",
        "se producirá sequía",
    ]
    for frase in frases_prohibidas:
        assert frase.lower() not in texto_completo.lower(), (
            f"El texto afirma sequía: '{frase}' en '{texto_completo[:100]}'"
        )


def test_nino_uses_probabilistic_language():
    """En escenario nino con riesgo alto, debe usar lenguaje probabilístico."""
    r = recommend("high", 0.9, "high", 0.9, "resting", 10, "nino")
    texto = r["text"] + " ".join(r["reasons"])
    # Debe mencionar probabilidad, no certeza
    assert any(word in texto.lower() for word in ["probabilidad", "riesgo", "posible", "aumenta"]), (
        f"No usa lenguaje probabilístico: {texto[:200]}"
    )
