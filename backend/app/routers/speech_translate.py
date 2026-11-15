"""Endpoints de voz en español claro (TTS) y traducción con BERT (Español / Aymara / Quechua)."""

from __future__ import annotations

import re
import urllib.parse
import urllib.request
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field

from app.context import AppContext, get_ctx
from app.errors import ApiError
from app.services.bert_translator import BertIndigenousPipeline

router = APIRouter(prefix="/api", tags=["speech-translate"])


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    target_lang: Literal["es", "ay", "qu"] = "es"
    source_lang: str = "auto"


class TranslateResponse(BaseModel):
    translated_text: str
    detected_lang: str
    target_lang: str
    model: str


def _split_tts_chunks(text: str, max_len: int = 175) -> list[str]:
    sentences = re.split(r"(?<=[.!?;:])\s+", text.strip())
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        for part in re.findall(r".{1,175}(?:\s+|$)", sentence):
            piece = part.strip()
            if not piece:
                continue
            if len(current) + len(piece) + 1 <= max_len:
                current = f"{current} {piece}".strip()
            else:
                if current:
                    chunks.append(current)
                current = piece
    if current:
        chunks.append(current)
    return chunks[:8]


@router.get(
    "/tts",
    summary="Voz clara en español latinoamericano (y lectura fonética de Aymara/Quechua)",
)
def tts_audio(
    text: str = Query(..., min_length=1, max_length=1200),
    lang: Literal["es", "ay", "qu"] = Query("es"),
    ctx: AppContext = Depends(get_ctx),
) -> Response:
    # Aymara y quechua: voz nativa (MMS) si está instalada; si no, fonética.
    if lang != "es":
        native = ctx.local_tts.synthesize(text, lang)
        if native:
            return Response(
                content=native,
                media_type="audio/wav",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "X-Voice": "mms",
                },
            )

    spoken_text = BertIndigenousPipeline.phonetic_for_tts(text, lang)
    chunks = _split_tts_chunks(spoken_text)
    if not chunks:
        raise ApiError(422, "invalid_request", "Texto vacío para voz.")

    audio_parts: list[bytes] = []
    try:
        for chunk in chunks:
            url = (
                "https://translate.google.com/translate_tts?ie=UTF-8"
                "&client=tw-ob&tl=es-US&ttsspeed=0.9&q="
                + urllib.parse.quote(chunk)
            )
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                audio_parts.append(resp.read())
    except Exception as exc:  # noqa: BLE001
        raise ApiError(
            502,
            "tts_unavailable",
            "Servicio de voz en línea no disponible.",
        ) from exc

    return Response(
        content=b"".join(audio_parts),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Voice": "phonetic" if lang != "es" else "es",
        },
    )


@router.post(
    "/translate",
    response_model=TranslateResponse,
    summary="Traducción de voz y texto con pipeline BERT (Español, Aymara y Quechua)",
)
def translate_text(
    body: TranslateRequest,
    ctx: AppContext = Depends(get_ctx),
) -> TranslateResponse:
    pipeline = BertIndigenousPipeline(ctx)
    detected = (
        pipeline.detect_language(body.text)
        if body.source_lang == "auto"
        else body.source_lang
    )
    translated = pipeline.translate(
        body.text,
        target_lang=body.target_lang,
        source_lang=detected,
    )
    return TranslateResponse(
        translated_text=translated,
        detected_lang=detected,
        target_lang=body.target_lang,
        model=BertIndigenousPipeline.MODEL_ID,
    )
