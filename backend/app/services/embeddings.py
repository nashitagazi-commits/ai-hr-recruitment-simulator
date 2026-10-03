"""Sentence Transformers embeddings (free, runs locally). available() is False if the model cannot load."""
import hashlib
import logging
from functools import lru_cache
from ..core.config import settings

log = logging.getLogger("ai")
_override = None  # tests can inject a fake model here
_cache: dict[str, list[float]] = {}


@lru_cache
def _load():
    if not settings.USE_EMBEDDINGS:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(settings.EMBEDDING_MODEL)
    except Exception as exc:
        log.warning("Embeddings unavailable (%s) - using skill-overlap matching", exc)
        return None


def _model():
    return _override or _load()


def available() -> bool:
    return _model() is not None


def embed(texts: list[str]) -> list[list[float]]:
    out = _model().encode(texts, normalize_embeddings=True)
    return [list(map(float, v)) for v in out]


def embed_cached(text: str) -> list[float]:
    key = hashlib.md5(text.encode()).hexdigest()
    if key not in _cache:
        if len(_cache) > 2000:
            _cache.clear()
        _cache[key] = embed([text])[0]
    return _cache[key]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))  # vectors are normalised


try:
    from langchain_core.embeddings import Embeddings

    class LCEmbeddings(Embeddings):
        """Adapter so LangChain/Chroma can use our Sentence Transformers model."""
        def embed_documents(self, texts):
            return embed(texts)

        def embed_query(self, text):
            return embed([text])[0]
except Exception:  # langchain not installed
    LCEmbeddings = None
