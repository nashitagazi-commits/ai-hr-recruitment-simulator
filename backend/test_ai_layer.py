"""Tests the AI layer WITHOUT downloading models or calling OpenAI (fake embeddings + fake GPT).
Run:  python test_ai_layer.py"""
import hashlib, io, os, re, tempfile
import numpy as np

os.environ["DATABASE_URL"] = "sqlite:///./test_ai.db"
os.environ["CHROMA_DIR"] = tempfile.mkdtemp()

from app.core.config import settings
settings.CHROMA_DIR = os.environ["CHROMA_DIR"]
from app.services import embeddings, vectorstore, agents, ai
from app.services.llm import ParsedResume, QuestionList, AnswerEval, CopilotFilters


class FakeST:  # bag-of-words hashing "embedding model"
    def encode(self, texts, normalize_embeddings=True):
        out = []
        for t in texts:
            v = np.zeros(128)
            for w in re.findall(r"[a-z+#]+", t.lower()):
                v[int(hashlib.md5(w.encode()).hexdigest(), 16) % 128] += 1
            out.append(v / (np.linalg.norm(v) or 1))
        return np.array(out)


embeddings._override = FakeST()
assert ai.status()["embeddings"] and ai.status()["vector_db"]

# ---- RAG engine ----
R1 = "Backend developer. Built REST APIs with Python FastAPI and PostgreSQL. Deployed services with Docker on AWS. " * 3
R2 = "Registered nurse with ten years of hospital experience in patient care and emergency response procedures. " * 3
assert vectorstore.index_resume(1, R1) and vectorstore.index_resume(2, R2)
assert "FastAPI" in " ".join(vectorstore.retrieve(1, "python api", 2))
rank = vectorstore.rank_users("python fastapi backend developer", [1, 2])
assert rank[1] > rank[2], rank
print("RAG retrieval + semantic ranking OK", {k: round(v, 2) for k, v in rank.items()})

# ---- semantic match score ----
good = ai.match_score(["python", "fastapi"], R1, ["python", "fastapi", "docker"], "Build backend APIs in Python")
bad = ai.match_score(["python", "fastapi"], R2, ["python", "fastapi", "docker"], "Build backend APIs in Python")
assert good > bad, (good, bad)
print("match score OK:", good, ">", bad)

# ---- agents with a fake GPT ----
seen = {}
def fake_structured(schema, system, user):
    seen[schema.__name__] = user
    if schema is QuestionList:
        return QuestionList(questions=[f"Generated question {i}" for i in range(1, 9)])
    if schema is AnswerEval:
        return AnswerEval(technical=150, communication=80, confidence=-5, comment="Good depth.")
    if schema is ParsedResume:
        return ParsedResume(name="Jane Roe", skills=["Python", "ML", "Leadership"], experience=["Engineer, Acme, 2 yrs"], experience_years=2.5)
    if schema is CopilotFilters:
        return CopilotFilters(limit=3, skills=["Node.js"], min_score=70, semantic_query="")
agents.structured = fake_structured

qs = ai.generate_questions({"skills": ["python"]}, "Backend Dev", ["python"], 8, user_id=1, job_description="APIs")
assert qs[0] == "Generated question 1" and len(qs) == 8
assert "FastAPI" in seen["QuestionList"], "RAG context must reach the prompt"
print("Interview agent OK (RAG chunks reached the prompt)")

ev = ai.evaluate_answer("Q?", "I built APIs", {"skills": []}, 20)
assert ev == {"technical": 100, "communication": 80, "confidence": 0, "comment": "Good depth."}, ev
assert ai.evaluate_answer("Q?", "(No answer)", {})["technical"] == 0
print("Evaluation agent OK (scores clamped to 0-100)")

p = ai.parse_resume("Jane Roe\nSoftware Engineer 2020 - 2022\nPython")
assert p["name"] == "Jane Roe" and "machine learning" in p["skills"] and p["experience_years"] == 2.5, p
print("Resume agent OK:", p["skills"])

c = ai.copilot_parse("top 3 node developers over 70")
assert c["skills"] == ["node"] and c["limit"] == 3, c
print("Copilot agent OK:", c)

# ---- graceful failure: LLM returns None -> fallbacks ----
agents.structured = lambda *a, **k: None
assert len(ai.generate_questions({"skills": ["python"]}, "Dev", ["python"], 8)) == 8
assert ai.evaluate_answer("Q", "word " * 30, {"skills": []})["communication"] > 40
print("Fallbacks OK when GPT is unavailable")

# ---- voice without keys ----
assert ai.text_to_speech("hello") is None
print("Voice OK (no key -> TTS None, transcription placeholder)")
print("ALL AI TESTS PASSED")
