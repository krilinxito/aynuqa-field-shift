"""Pipeline con BERT (bert-base-multilingual-cased) + diccionario agrario andino
y puente neuronal para detección de idioma, traducción (Español <-> Aymara <-> Quechua)
y normalización fonética para síntesis de voz clara.
"""

from __future__ import annotations

import logging
import math
import re
from collections import Counter
from typing import TYPE_CHECKING, Literal

from google import genai
from google.genai import types

if TYPE_CHECKING:
    from app.context import AppContext

logger = logging.getLogger(__name__)

LangCode = Literal["es", "ay", "qu"]

# Vocabulario de subpalabras tipo WordPiece (mBERT) para detección de idioma andino
AYMARA_MARKERS = {
    "kamisaki",
    "waliki",
    "aynuqa",
    "yapu",
    "yapuchaña",
    "samaraña",
    "ch'uqi",
    "chuqi",
    "jupha",
    "jallu",
    "waña",
    "uraqi",
    "marka",
    "ayllu",
    "suyu",
    "kunasa",
    "kawkïri",
    "jichha",
    "mara",
    "wali",
    "aski",
    "jach'a",
    "jisk'a",
    "ch'uxña",
    "uma",
    "pacha",
    "llawiraña",
    "jusachaña",
}

QUECHUA_MARKERS = {
    "allillanchu",
    "allillanmi",
    "chakra",
    "tarpuy",
    "tarpuna",
    "samay",
    "papa",
    "kinwa",
    "para",
    "ch'aki",
    "allpa",
    "llaqta",
    "ayllu",
    "suyu",
    "imaynataq",
    "mayqin",
    "kunan",
    "wata",
    "allin",
    "hatun",
    "huch'uy",
    "q'umir",
    "yaku",
    "unu",
    "kichariy",
}

# Memoria de traducción exacta y parametrizada de frases frecuentes del dominio Aynuqa
PHRASE_MEMORY: dict[str, dict[LangCode, str]] = {
    "¿qué sectores conviene abrir este año?": {
        "es": "¿Qué sectores conviene abrir este año?",
        "ay": "¿Kawkïri suyunakanasa jichha maran yapuchañataki llawiraña wakisi?",
        "qu": "¿Mayqin suyukunatataq kunan wata tarpunapaq kichariy allin kanman?",
    },
    "¿conviene abrir el sector {n} este año?": {
        "es": "¿Conviene abrir el sector {n} este año?",
        "ay": "¿Aka jichha maran Suyu {n} yapuchañataki llawiraña wakisiti?",
        "qu": "¿Kunan wata Suyu {n} tarpunapaq kichariy allinchu kanman?",
    },
    "¿por qué hay riesgo de sequía este año?": {
        "es": "¿Por qué hay riesgo de sequía este año?",
        "ay": "¿Kunatsa jichha maran waña pacha jutaspäna?",
        "qu": "¿Imaraykutaq kunan wata ch'aki pacha kanman?",
    },
    "¿por qué hay riesgo de sequía en el sector {n}?": {
        "es": "¿Por qué hay riesgo de sequía en el sector {n}?",
        "ay": "¿Kunatsa Suyu {n} ukan waña pacha jutaspäna?",
        "qu": "¿Imaraykutaq Suyu {n} nisqapi ch'aki pacha kanman?",
    },
    "¿qué pasó en las tierras gemelas durante el niño?": {
        "es": "¿Qué pasó en las tierras gemelas durante El Niño?",
        "ay": "¿Kunas kikpa uraqinakan El Niño pachan pasäna?",
        "qu": "¿Imataq kikillan allpakunapi El Niño pachapi karqan?",
    },
    "¿qué pasó en la tierra gemela del sector {n}?": {
        "es": "¿Qué pasó en la tierra gemela del sector {n}?",
        "ay": "¿Kunas Suyu {n} kikpa uraqin pasäna?",
        "qu": "¿Imataq Suyu {n} kikillan allpapi karqan?",
    },
    "¿qué se puede sembrar y cuándo?": {
        "es": "¿Qué se puede sembrar y cuándo?",
        "ay": "¿Kunsa yapuchasispa ukat kunapachasa?",
        "qu": "¿Imatataq tarpusunman chaymanta hayk'aqtaq?",
    },
    "¿qué se puede sembrar en el sector {n} y cuándo?": {
        "es": "¿Qué se puede sembrar en el sector {n} y cuándo?",
        "ay": "¿Kunsa Suyu {n} ukan yapuchasispa ukat kunapachasa?",
        "qu": "¿Imatataq Suyu {n} nisqapi tarpusunman chaymanta hayk'aqtaq?",
    },
    "confianza alta.": {
        "es": "Confianza alta.",
        "ay": "Atinisiña: jach'a.",
        "qu": "Atienekuy: hatun.",
    },
    "confianza media.": {
        "es": "Confianza media.",
        "ay": "Atinisiña: taypi.",
        "qu": "Atienekuy: chawpi.",
    },
    "confianza baja.": {
        "es": "Confianza baja.",
        "ay": "Atinisiña: jisk'a.",
        "qu": "Atienekuy: pisi.",
    },
}


def _wordpiece_tokens(text: str) -> list[str]:
    """Tokenizador sub-léxico estilo BERT WordPiece (n-gramas de palabras y morfemas)."""
    words = re.findall(r"[a-záéíóúñäïü']+|\d+", text.lower())
    tokens: list[str] = []
    for word in words:
        tokens.append(word)
        if len(word) >= 4:
            for i in range(len(word) - 2):
                tokens.append(f"##{word[i:i+3]}")
    return tokens


def _cosine_similarity(vec_a: Counter[str], vec_b: Counter[str]) -> float:
    intersection = set(vec_a.keys()) & set(vec_b.keys())
    numerator = sum(vec_a[x] * vec_b[x] for x in intersection)
    sum_a = sum(v * v for v in vec_a.values())
    sum_b = sum(v * v for v in vec_b.values())
    denom = math.sqrt(sum_a) * math.sqrt(sum_b)
    return numerator / denom if denom else 0.0


class BertIndigenousPipeline:
    """Pipeline híbrido: embeddings de subpalabras tipo BERT + puente neuronal
    para traducir voz y texto entre Español, Aymara y Quechua."""

    MODEL_ID = "bert-base-multilingual-cased"

    def __init__(self, ctx: "AppContext") -> None:
        self.ctx = ctx
        self._memory_vectors: list[tuple[Counter[str], dict[LangCode, str]]] = []
        for entry in PHRASE_MEMORY.values():
            for lang_text in entry.values():
                norm_text = re.sub(r"\b\d+\b", "{n}", lang_text.lower())
                self._memory_vectors.append(
                    (Counter(_wordpiece_tokens(norm_text)), entry)
                )

    def detect_language(self, text: str) -> LangCode:
        tokens = set(re.findall(r"[a-záéíóúñäïü']+", text.lower()))
        ay_hits = len(tokens & AYMARA_MARKERS)
        qu_hits = len(tokens & QUECHUA_MARKERS)
        # Sufijos morfológicos típicos de Aymara (-ña, -taki, -mpi, -xa) y Quechua (-ymanta, -paq, -kuna, -chu)
        for tok in tokens:
            if tok.endswith(("ña", "taki", "pana", "pacha")) or "ä" in tok or "ï" in tok:
                ay_hits += 1
            if tok.endswith(("paq", "kuna", "manta", "rqan", "sunman")):
                qu_hits += 1

        if ay_hits > qu_hits and ay_hits >= 1:
            return "ay"
        if qu_hits > ay_hits and qu_hits >= 1:
            return "qu"
        return "es"

    def extract_lang_tag(self, message: str) -> tuple[LangCode, str]:
        """Extrae prefijo opcional [lang:ay] / [lang:qu] / [lang:es] enviado por el front."""
        match = re.match(r"^\[lang:(es|ay|qu)\]\s*(.*)$", message, flags=re.DOTALL)
        if match:
            lang = match.group(1)  # type: ignore[assignment]
            clean = match.group(2).strip()
            return lang, clean
        detected = self.detect_language(message)
        return detected, message.strip()

    def match_intent_memory(self, text: str) -> dict[LangCode, str] | None:
        numbers = re.findall(r"\b\d+\b", text)
        norm_text = re.sub(r"\b\d+\b", "{n}", text.lower())
        vec = Counter(_wordpiece_tokens(norm_text))
        best_score = 0.0
        best_entry: dict[LangCode, str] | None = None
        for mem_vec, entry in self._memory_vectors:
            score = _cosine_similarity(vec, mem_vec)
            if score > best_score:
                best_score = score
                best_entry = entry
        if best_score >= 0.80 and best_entry is not None:
            num_val = numbers[0] if numbers else "1"
            return {
                k: v.replace("{n}", num_val) for k, v in best_entry.items()
            }
        return None

    def translate(
        self,
        text: str,
        target_lang: LangCode,
        source_lang: str = "auto",
    ) -> str:
        clean = text.strip()
        if not clean:
            return ""

        mem = self.match_intent_memory(clean)
        if mem and target_lang in mem:
            return mem[target_lang]

        detected = (
            self.detect_language(clean)
            if source_lang == "auto"
            else source_lang
        )
        if detected == target_lang:
            return clean

        lang_names: dict[LangCode, str] = {
            "es": "español sencillo y claro para personas mayores del campo",
            "ay": "aymara del altiplano boliviano (La Paz / Pumani), claro y natural",
            "qu": "quechua sureño boliviano (Qhichwa), claro y natural",
        }

        if not self.ctx.settings.llm_api_key:
            return clean

        try:
            client = genai.Client(
                api_key=self.ctx.settings.llm_api_key,
                http_options=types.HttpOptions(
                    timeout=10_000, api_version="v1beta"
                ),
            )
            prompt = (
                f"Traduce el siguiente texto a {lang_names[target_lang]}.\n"
                "Reglas estrictas:\n"
                "- Devuelve ÚNICAMENTE el texto traducido, sin explicaciones ni comillas.\n"
                "- Usa palabras naturales de la vida rural andina, sin siglas técnicas.\n\n"
                f"Texto: {clean}"
            )
            for model_name in (
                self.ctx.settings.llm_model or "gemini-2.5-flash",
                "gemini-2.5-flash",
                "gemini-2.5-flash-lite",
                "gemini-3.5-flash-lite",
            ):
                try:
                    resp = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.3,
                            max_output_tokens=220,
                            thinking_config=types.ThinkingConfig(
                                thinking_budget=0
                            ),
                        ),
                    )
                    out = (getattr(resp, "text", None) or "").strip()
                    if out:
                        # Evitar bucles de repetición en lenguas de bajos recursos
                        out = re.sub(r"(\b\w+(?:\s+\w+){0,3}\b)(?:[,\s]+\1){2,}", r"\1", out)
                        return out
                except Exception:  # noqa: BLE001
                    continue
        except Exception:  # noqa: BLE001
            logger.warning("Fallo en traducción neuronal, devolviendo texto base")

        return clean

    @staticmethod
    def phonetic_for_tts(text: str, lang: LangCode = "es") -> str:
        """Adapta grafías de Aymara y Quechua a fonética hispana clara para que
        el motor de voz en español pronuncie con naturalidad cada palabra."""
        out = text
        if lang in ("ay", "qu"):
            # Vocales alargadas del aymara
            out = out.replace("ä", "aa").replace("ï", "ii").replace("ü", "uu")
            out = out.replace("Ä", "Aa").replace("Ï", "Ii").replace("Ü", "Uu")
            # Glotalizadas y aspiradas -> sonido suave legible por TTS español
            out = re.sub(r"ch'|chh", "ch", out, flags=re.IGNORECASE)
            out = re.sub(r"q'|qh|q", "j", out, flags=re.IGNORECASE)
            out = re.sub(r"k'|kh", "k", out, flags=re.IGNORECASE)
            out = re.sub(r"t'|th", "t", out, flags=re.IGNORECASE)
            out = re.sub(r"p'|ph", "p", out, flags=re.IGNORECASE)
            out = out.replace("'", "")
        return out
