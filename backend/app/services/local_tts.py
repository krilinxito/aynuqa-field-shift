"""Voz real en aymara y quechua con Meta MMS-TTS (VITS), corriendo en CPU.

Es opcional: solo se activa con `TTS_LOCAL_MODELS=true` y si `torch` y
`transformers` están instalados (`requirements-tts.txt`). Si algo falla,
`synthesize` devuelve `None` y el router usa la lectura fonética de siempre.

Modelos (licencia CC-BY-NC 4.0, uso no comercial):
- Aymara central: `facebook/mms-tts-ayr`
- Quechua del sur de Bolivia: `facebook/mms-tts-quh`
"""

from __future__ import annotations

import hashlib
import io
import logging
import re
import threading
import wave
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MODEL_IDS = {
    "ay": "facebook/mms-tts-ayr",
    "qu": "facebook/mms-tts-quh",
}

_PARENS = re.compile(r"\s*\([^)]*\)")
_SENTENCES = re.compile(r"(?<=[.!?;:])\s+")


def clean_for_mms(text: str) -> str:
    """Quita las glosas en español entre paréntesis y normaliza apóstrofos."""
    text = _PARENS.sub("", text)
    text = text.replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", text).strip().lower()


class LocalTts:
    def __init__(self, cache_dir: Path, enabled: bool) -> None:
        self.cache_dir = cache_dir
        self.enabled = enabled
        self._models: dict[str, tuple[Any, Any]] = {}
        self._lock = threading.Lock()
        self._unavailable = False

    def supports(self, lang: str) -> bool:
        return self.enabled and not self._unavailable and lang in MODEL_IDS

    def warm_up(self) -> None:
        """Descarga y carga los modelos en segundo plano al iniciar."""
        if not self.enabled:
            return

        def load_all() -> None:
            for lang in MODEL_IDS:
                self._load(lang)

        threading.Thread(target=load_all, name="mms-warmup", daemon=True).start()

    def _load(self, lang: str) -> tuple[Any, Any] | None:
        with self._lock:
            if lang in self._models:
                return self._models[lang]
            if self._unavailable:
                return None
            try:
                from transformers import AutoTokenizer, VitsModel  # noqa: PLC0415

                model_id = MODEL_IDS[lang]
                logger.info("Cargando voz %s", model_id)
                model = VitsModel.from_pretrained(model_id)
                model.eval()
                tokenizer = AutoTokenizer.from_pretrained(model_id)
            except Exception:  # noqa: BLE001
                logger.warning(
                    "Voz local no disponible; se usa la lectura fonética.",
                    exc_info=True,
                )
                self._unavailable = True
                return None
            self._models[lang] = (model, tokenizer)
            return self._models[lang]

    def synthesize(self, text: str, lang: str) -> bytes | None:
        """Devuelve un WAV mono de 16 bits, o `None` si no se puede."""
        if not self.supports(lang):
            return None
        cleaned = clean_for_mms(text)
        if not cleaned:
            return None

        key = hashlib.sha1(f"{lang}:{cleaned}".encode()).hexdigest()
        cached = self.cache_dir / f"{key}.wav"
        if cached.exists():
            return cached.read_bytes()

        loaded = self._load(lang)
        if loaded is None:
            return None
        model, tokenizer = loaded

        try:
            import numpy as np  # noqa: PLC0415
            import torch  # noqa: PLC0415

            pieces = []
            for sentence in _SENTENCES.split(cleaned):
                inputs = tokenizer(sentence, return_tensors="pt")
                if inputs["input_ids"].shape[-1] == 0:
                    continue
                with torch.no_grad():
                    waveform = model(**inputs).waveform[0].cpu().numpy()
                pieces.append(waveform)
                # Pausa corta entre frases.
                pieces.append(np.zeros(int(model.config.sampling_rate * 0.25)))
            if not pieces:
                return None
            audio = np.concatenate(pieces)
            pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2").tobytes()
        except Exception:  # noqa: BLE001
            logger.warning("Falló la voz local para %s", lang, exc_info=True)
            return None

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(model.config.sampling_rate)
            wav.writeframes(pcm)
        data = buffer.getvalue()

        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            cached.write_bytes(data)
        except OSError:
            pass
        return data
