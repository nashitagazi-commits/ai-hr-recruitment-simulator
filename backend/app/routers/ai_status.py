from fastapi import APIRouter, Depends
from ..deps import get_current_user
from ..models import User
from ..services import ai

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status")
def ai_status(user: User = Depends(get_current_user)):
    """Which AI components are active (GPT, embeddings, ChromaDB, Whisper, TTS)."""
    return ai.status()
