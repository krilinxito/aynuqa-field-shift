from __future__ import annotations

from app.services.local_tts import LocalTts, clean_for_mms


def test_clean_for_mms_drops_spanish_glosses() -> None:
    text = "Aka suyux samarañanakakïpan (Mantener en descanso). Jach’a iwxt’äwi"
    assert clean_for_mms(text) == "aka suyux samarañanakakïpan. jach'a iwxt'äwi"


def test_disabled_local_tts_returns_none(tmp_path) -> None:
    tts = LocalTts(tmp_path, enabled=False)
    assert not tts.supports("ay")
    assert tts.synthesize("kamisaki", "ay") is None


def test_tts_falls_back_when_local_voice_missing(client, monkeypatch) -> None:
    ctx = client.app.state.ctx
    monkeypatch.setattr(ctx.local_tts, "synthesize", lambda text, lang: b"RIFFfake")
    response = client.get("/api/tts", params={"text": "Kamisaki", "lang": "ay"})
    assert response.status_code == 200
    assert response.headers["x-voice"] == "mms"
    assert response.headers["content-type"] == "audio/wav"
