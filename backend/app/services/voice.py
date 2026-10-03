"""Voice AI: Whisper speech-to-text and OpenAI text-to-speech."""
import io
import logging
import os
import tempfile
from functools import lru_cache
from ..core.config import settings

log = logging.getLogger("ai")
PLACEHOLDER = "[Could not transcribe - please type your answer]"


def _client():
    from openai import OpenAI
    return OpenAI(api_key=settings.OPENAI_API_KEY)


@lru_cache
def _local_whisper():
    from faster_whisper import WhisperModel
    return WhisperModel(settings.WHISPER_LOCAL_MODEL, device="cpu", compute_type="int8")


def whisper_mode() -> str:
    if settings.WHISPER_MODE == "api" or (settings.WHISPER_MODE == "auto" and settings.OPENAI_API_KEY):
        return "api" if settings.OPENAI_API_KEY else "unavailable"
    return "local"


def transcribe(audio_bytes: bytes, filename: str) -> str:
    if whisper_mode() == "api":
        try:
            f = io.BytesIO(audio_bytes)
            f.name = filename or "audio.webm"
            return _client().audio.transcriptions.create(model="whisper-1", file=f).text.strip()
        except Exception as exc:
            log.warning("Whisper API failed (%s)", exc)
    try:
        suffix = os.path.splitext(filename or "")[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            path = tmp.name
        try:
            segments, _ = _local_whisper().transcribe(path, language="en")
            return " ".join(s.text.strip() for s in segments).strip() or PLACEHOLDER
        finally:
            os.unlink(path)
    except Exception as exc:
        log.warning("Local Whisper unavailable (%s)", exc)
        return PLACEHOLDER


def tts(text: str) -> bytes | None:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        resp = _client().audio.speech.create(model=settings.OPENAI_TTS_MODEL, voice=settings.OPENAI_TTS_VOICE, input=text)
        return resp.content
    except Exception as exc:
        log.warning("TTS failed (%s)", exc)
        return None
