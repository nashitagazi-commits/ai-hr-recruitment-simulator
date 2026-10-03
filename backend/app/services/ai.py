"""
AI facade. The routers call these functions; each delegates to an agent in agents.py.
Signatures are unchanged from the baseline version, so nothing else in the backend needs to know about the models.
"""
from pypdf import PdfReader
from ..core.config import settings
from . import embeddings, vectorstore, voice
from .agents import ResumeAgent, RAGEngine, InterviewAgent, EvaluationAgent, CopilotAgent
from .llm import get_llm

_resume, _interview, _evaluation, _copilot = ResumeAgent(), InterviewAgent(), EvaluationAgent(), CopilotAgent()


def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def parse_resume(text: str) -> dict:
    return _resume.parse(text)


def match_score(candidate_skills, resume_text, job_skills, job_text) -> float:
    return RAGEngine.match_score(candidate_skills, resume_text, job_skills, job_text)


def index_resume(user_id: int, text: str) -> None:
    RAGEngine.index(user_id, text)


def generate_questions(resume, job_title, job_skills, n=8, user_id=None, job_description="") -> list[str]:
    return _interview.questions(resume, job_title, job_skills, job_description, n, user_id)


def evaluate_answer(question, answer, resume, time_taken=None) -> dict:
    return _evaluation.score(question, answer, resume, time_taken)


def final_feedback(breakdown) -> str:
    return _evaluation.feedback(breakdown)


def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    return voice.transcribe(audio_bytes, filename)


def text_to_speech(text: str):
    return voice.tts(text)


def copilot_parse(message: str) -> dict:
    return _copilot.parse(message)


def semantic_rank(query: str, user_ids) -> dict:
    return RAGEngine.rank(query, user_ids)


def status() -> dict:
    return {
        "llm": get_llm() is not None, "llm_model": settings.OPENAI_MODEL if get_llm() else None,
        "embeddings": embeddings.available(), "vector_db": vectorstore.available(),
        "whisper": voice.whisper_mode(), "tts": bool(settings.OPENAI_API_KEY),
    }
