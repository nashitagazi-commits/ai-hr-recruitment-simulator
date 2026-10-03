"""RAG engine: ChromaDB vector store of resume chunks, built through LangChain."""
import logging
from functools import lru_cache
from ..core.config import settings
from . import embeddings

log = logging.getLogger("ai")


def chunk_text(text: str, size: int = 600, overlap: int = 100) -> list[str]:
    text = " ".join(text.split())
    chunks, i = [], 0
    while i < len(text):
        chunks.append(text[i:i + size])
        i += size - overlap
    return [c for c in chunks if len(c.strip()) > 40]


@lru_cache
def _store():
    from langchain_chroma import Chroma
    return Chroma(collection_name="resumes", embedding_function=embeddings.LCEmbeddings(),
                  persist_directory=settings.CHROMA_DIR, collection_metadata={"hnsw:space": "cosine"})


def reset_for_tests():
    _store.cache_clear()


def available() -> bool:
    return embeddings.available() and embeddings.LCEmbeddings is not None


def index_resume(user_id: int, text: str) -> bool:
    if not available():
        return False
    try:
        store, chunks = _store(), chunk_text(text)
        store._collection.delete(where={"user_id": user_id})  # replace the old version of this resume
        if chunks:
            store.add_texts(chunks, metadatas=[{"user_id": user_id, "chunk": i} for i in range(len(chunks))],
                            ids=[f"u{user_id}-c{i}" for i in range(len(chunks))])
        return True
    except Exception as exc:
        log.warning("Indexing failed (%s)", exc)
        return False


def retrieve(user_id: int, query: str, k: int = 4) -> list[str]:
    if not available():
        return []
    try:
        return [d.page_content for d in _store().similarity_search(query, k=k, filter={"user_id": user_id})]
    except Exception as exc:
        log.warning("Retrieval failed (%s)", exc)
        return []


def rank_users(query: str, user_ids, k: int = 60) -> dict[int, float]:
    """Semantic search across resumes -> {user_id: best similarity}"""
    user_ids = list(user_ids)
    if not available() or not user_ids:
        return {}
    try:
        res = _store().similarity_search_with_score(query, k=k, filter={"user_id": {"$in": user_ids}})
        best: dict[int, float] = {}
        for doc, dist in res:
            uid = doc.metadata["user_id"]
            best[uid] = max(best.get(uid, -1.0), 1.0 - float(dist))
        return best
    except Exception as exc:
        log.warning("Semantic search failed (%s)", exc)
        return {}
