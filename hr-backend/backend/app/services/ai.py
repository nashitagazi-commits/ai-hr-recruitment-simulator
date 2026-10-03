"""
AI HOOKS  -  the AI team replaces the bodies of these functions.
Signatures and return shapes MUST stay the same so the API keeps working.
Current implementations are simple rule-based placeholders so the whole app runs end-to-end today.
"""
import re
from pypdf import PdfReader

KNOWN_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node", "fastapi", "django", "flask", "sql",
    "postgresql", "mongodb", "docker", "kubernetes", "aws", "azure", "git", "html", "css", "tailwind",
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch", "c++", "c#",
    "langchain", "rag", "llm", "rest", "graphql", "linux", "excel", "communication", "leadership",
]


def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join((p.extract_text() or "") for p in reader.pages)


# ---- 1. RESUME AGENT (NER/regex now -> LLM structured extraction later) -------------------------
def parse_resume(text: str) -> dict:
    """Return {name, email, skills[], experience[], education[], experience_years}"""
    lower = text.lower()
    skills = sorted({s for s in KNOWN_SKILLS if re.search(rf"(?<![a-z]){re.escape(s)}(?![a-z])", lower)})
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
    years = [int(y) for y in re.findall(r"(\d{1,2})\+?\s*(?:years|yrs)", lower)]
    edu = [l for l in lines if re.search(r"b\.?tech|b\.?e\b|m\.?tech|bachelor|master|mba|b\.?sc|m\.?sc|university|college", l, re.I)][:3]
    exp = [l for l in lines if re.search(r"engineer|developer|intern|analyst|manager|consultant", l, re.I)][:4]
    return {
        "name": lines[0][:80] if lines else "",
        "email": email.group(0) if email else "",
        "skills": skills,
        "experience": exp,
        "education": edu,
        "experience_years": max(years) if years else 0,
    }


# ---- 2. EMBEDDINGS + VECTOR DB (Sentence-Transformers + ChromaDB later) ---------------------------
def match_score(candidate_skills: list[str], resume_text: str, job_skills: list[str], job_text: str) -> float:
    """Return 0-100 similarity. Replace with cosine similarity of embeddings."""
    if not job_skills:
        return 0.0
    cs = {s.lower() for s in candidate_skills}
    js = {s.lower() for s in job_skills}
    return round(100 * len(cs & js) / len(js), 1)


def index_resume(user_id: int, text: str) -> None:
    """Chunk + embed + upsert into ChromaDB (used by RAG). No-op for now."""
    return None


# ---- 3. INTERVIEW AGENT (RAG + LLM later) -----------------------------------------------------------
def generate_questions(resume: dict, job_title: str, job_skills: list[str], n: int = 8) -> list[str]:
    skills = (resume.get("skills") or job_skills or ["your main tech stack"])[:4]
    qs = [
        f"Tell me about yourself and why you are applying for the {job_title} role.",
        *[f"Describe a project where you used {s}. What was your contribution?" for s in skills],
        "Tell me about a time you faced a difficult deadline. How did you handle it?",
        "How do you debug a problem you have never seen before?",
        "Where do you see yourself in three years?",
    ]
    return qs[:n]


# ---- 4. EVALUATION AGENT (LLM-as-judge later) ---------------------------------------------------------
def evaluate_answer(question: str, answer: str, resume: dict, time_taken: int | None = None) -> dict:
    """Return {technical, communication, confidence} each 0-100."""
    words = len(answer.split())
    comm = min(100, 40 + words * 2)
    tech = min(100, 30 + words + 5 * sum(s in answer.lower() for s in resume.get("skills", [])))
    conf = 70 if words > 15 else 45
    return {"technical": tech, "communication": comm, "confidence": conf}


def final_feedback(breakdown: dict) -> str:
    best = max(breakdown, key=breakdown.get)
    worst = min(breakdown, key=breakdown.get)
    return f"Strongest area: {best}. Area to improve: {worst}."


# ---- 5. VOICE AI (Whisper + TTS later) ------------------------------------------------------------------
def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Whisper: return transcript text."""
    return "[transcription placeholder - connect Whisper here]"


def text_to_speech(text: str) -> bytes | None:
    """TTS: return audio bytes (mp3). None => frontend falls back to browser speechSynthesis."""
    return None


# ---- 6. HR COPILOT (LangChain + RAG later) ----------------------------------------------------------------
def copilot_parse(message: str) -> dict:
    """Extract structured filters from natural language. Replace with LLM function-calling."""
    m = message.lower()
    top = re.search(r"top\s+(\d+)", m)
    score = re.search(r"(?:above|over|>)\s*(\d+)", m)
    return {
        "limit": int(top.group(1)) if top else 5,
        "skills": [s for s in KNOWN_SKILLS if s in m],
        "min_score": float(score.group(1)) if score else None,
    }
