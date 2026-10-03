"""
The five agents from the architecture slide. Each one uses GPT (via LangChain) when an API key is set
and falls back to a rule-based version otherwise, so the app never breaks.

  ResumeAgent      - NER + regex + GPT structured extraction
  RAGEngine        - ChromaDB + Sentence Transformers retrieval
  InterviewAgent   - RAG-grounded question generation
  EvaluationAgent  - GPT-as-judge scoring
  CopilotAgent     - natural-language search filters + semantic candidate search
"""
import re
from datetime import datetime
from functools import lru_cache
from . import embeddings, vectorstore
from .llm import structured, ParsedResume, QuestionList, AnswerEval, CopilotFilters

KNOWN_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node", "fastapi", "django", "flask", "sql",
    "postgresql", "mongodb", "docker", "kubernetes", "aws", "azure", "gcp", "git", "html", "css", "tailwind",
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch", "c++", "c#",
    "langchain", "rag", "llm", "rest", "graphql", "linux", "excel", "communication", "leadership",
    "scikit-learn", "opencv", "spring", "angular", "vue", "redis", "kafka", "figma", "r", "go",
]
ALIASES = {"nodejs": "node", "node.js": "node", "reactjs": "react", "react.js": "react", "ml": "machine learning",
           "js": "javascript", "ts": "typescript", "k8s": "kubernetes", "postgres": "postgresql",
           "sklearn": "scikit-learn", "vuejs": "vue", "golang": "go"}
EDU_RE = re.compile(r"b\.?tech|b\.?e\b|m\.?tech|bachelor|master|mba|b\.?sc|m\.?sc|ph\.?d|university|college|school|cgpa|gpa", re.I)


def norm_skill(s: str) -> str:
    s = s.strip().lower()
    return ALIASES.get(s, s)


def find_skills(text: str) -> list[str]:
    low = text.lower()
    found = {s for s in KNOWN_SKILLS if re.search(rf"(?<![a-z0-9+#]){re.escape(s)}(?![a-z0-9+#])", low)}
    for alias, canon in ALIASES.items():
        if re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", low):
            found.add(canon)
    return sorted(found)


@lru_cache
def _nlp():
    try:
        import spacy
        return spacy.load("en_core_web_sm")
    except Exception:
        return None


def years_from_ranges(text: str) -> float:
    """Sum employment date ranges like '2021 - 2023' or 'Jan 2022 - Present' (education lines are skipped)."""
    now, spans = datetime.now().year, []
    for line in text.splitlines():
        if EDU_RE.search(line):
            continue
        for m in re.finditer(r"(?<!\d)((?:19|20)\d{2})\s*(?:-|to|\u2013|\u2014)\s*((?:19|20)\d{2}|present|current|now)", line, re.I):
            a = int(m.group(1))
            b = now if m.group(2).lower() in ("present", "current", "now") else int(m.group(2))
            if a <= b <= now + 1 and b - a <= 40:
                spans.append((a, min(b, now)))
    spans.sort()
    total, cur = 0, None
    for s, e in spans:
        if cur and s <= cur[1]:
            cur = (cur[0], max(cur[1], e))
        else:
            if cur:
                total += cur[1] - cur[0]
            cur = (s, e)
    if cur:
        total += cur[1] - cur[0]
    return float(total)


def rule_parse(text: str) -> dict:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    name = lines[0][:80] if lines else ""
    nlp = _nlp()
    if nlp is not None:  # spaCy NER: first PERSON entity near the top of the resume
        for ent in nlp(text[:500]).ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                break
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
    stated = [int(y) for y in re.findall(r"(\d{1,2})\+?\s*(?:years|yrs)", text.lower())]
    return {
        "name": name,
        "email": email.group(0) if email else "",
        "skills": find_skills(text),
        "experience": [l for l in lines if re.search(r"engineer|developer|intern|analyst|manager|consultant", l, re.I)][:4],
        "education": [l for l in lines if EDU_RE.search(l)][:3],
        "experience_years": max(float(max(stated)) if stated else 0.0, years_from_ranges(text)),
    }


class ResumeAgent:
    SYSTEM = ("You extract structured data from resumes. Use only information present in the resume text. "
              "Skills must be short lowercase names such as python or machine learning. "
              "experience_years is total professional work experience in years (exclude education).")

    def parse(self, text: str) -> dict:
        base = rule_parse(text)
        llm = structured(ParsedResume, self.SYSTEM, text[:12000])
        if llm:
            d = llm.model_dump()
            skills = {norm_skill(s) for s in d["skills"] if s.strip()} | set(base["skills"])
            base.update(
                name=d["name"] or base["name"], email=d["email"] or base["email"], skills=sorted(skills),
                experience=d["experience"] or base["experience"], education=d["education"] or base["education"],
                experience_years=round(d["experience_years"], 1) if d["experience_years"] > 0 else base["experience_years"],
            )
        return base


class RAGEngine:
    index = staticmethod(vectorstore.index_resume)
    retrieve = staticmethod(vectorstore.retrieve)
    rank = staticmethod(vectorstore.rank_users)

    @staticmethod
    def match_score(candidate_skills, resume_text, job_skills, job_text) -> float:
        """0-100: skill overlap blended with semantic (embedding cosine) similarity."""
        skill = 0.0
        if job_skills:
            cs, js = {norm_skill(s) for s in candidate_skills}, {norm_skill(s) for s in job_skills}
            skill = 100 * len(cs & js) / len(js)
        if not (embeddings.available() and resume_text.strip()):
            return round(skill, 1)
        try:
            job_vec = embeddings.embed_cached((" ".join(job_skills) + ". " + job_text)[:2000])
            sims = sorted((embeddings.cosine(embeddings.embed_cached(c), job_vec)
                           for c in vectorstore.chunk_text(resume_text)[:8]), reverse=True)[:3]
            if not sims:
                return round(skill, 1)
            sem = max(0.0, min(1.0, (sum(sims) / len(sims) - 0.15) / 0.5)) * 100
            return round(sem if not job_skills else 0.6 * skill + 0.4 * sem, 1)
        except Exception:
            return round(skill, 1)


class InterviewAgent:
    SYSTEM = ("You are an experienced technical interviewer. Write interview questions for the candidate. "
              "The first question is a short warm-up about their background and motivation for the role. "
              "The remaining questions must be grounded in the candidate's resume excerpts and the job requirements, "
              "mixing technical depth, problem solving and one behavioural question. "
              "Each question stands alone, is one or two sentences, and has no numbering.")

    def questions(self, resume, job_title, job_skills, job_description="", n=8, user_id=None) -> list[str]:
        chunks = []
        if user_id is not None:
            chunks = RAGEngine.retrieve(user_id, f"{job_title} {' '.join(job_skills)} projects experience", 5)
        if not chunks:
            chunks = [" ".join((resume.get("experience") or []) + (resume.get("education") or []))]
        user = (f"Job title: {job_title}\nRequired skills: {', '.join(job_skills)}\nJob description: {job_description}\n"
                f"Candidate skills: {', '.join(resume.get('skills') or [])}\n"
                f"Resume excerpts:\n- " + "\n- ".join(c for c in chunks if c.strip()) + f"\n\nWrite exactly {n} questions.")
        out = structured(QuestionList, self.SYSTEM, user)
        if out:
            qs = [q.strip() for q in out.questions if q.strip()]
            if len(qs) >= 3:
                return qs[:n]
        return self.fallback(resume, job_title, job_skills, n)

    @staticmethod
    def fallback(resume, job_title, job_skills, n):
        skills = (resume.get("skills") or job_skills or ["your main tech stack"])[:4]
        qs = [f"Tell me about yourself and why you are applying for the {job_title} role.",
              *[f"Describe a project where you used {s}. What was your contribution?" for s in skills],
              "Tell me about a time you faced a difficult deadline. How did you handle it?",
              "How do you debug a problem you have never seen before?",
              "Where do you see yourself in three years?"]
        extras = ["What is the most challenging project you have worked on, and why?",
                  "Describe a disagreement with a teammate and how you resolved it.",
                  "Explain a technical concept from your field to a non-technical person.",
                  "How do you keep your technical skills up to date?"]
        for q in extras:
            if len(qs) >= n:
                break
            qs.append(q)
        return qs[:n]


class EvaluationAgent:
    SYSTEM = ("You are a fair but strict interview evaluator. Score the candidate's answer from 0 to 100 on three axes: "
              "technical (accuracy and depth), communication (clarity and structure) and confidence (decisive, assured tone). "
              "Irrelevant or very short answers score low. Do not reward length by itself. Add one short sentence of feedback.")

    def score(self, question, answer, resume, time_taken=None) -> dict:
        if answer.strip() in ("", "(No answer)"):
            return {"technical": 0, "communication": 0, "confidence": 0, "comment": "No answer given."}
        user = (f"Question: {question}\nCandidate answer: {answer}\n"
                f"Candidate skills: {', '.join(resume.get('skills') or [])}\n"
                f"Time used: {time_taken if time_taken is not None else 'unknown'} seconds of 60")
        out = structured(AnswerEval, self.SYSTEM, user)
        if out:
            clamp = lambda v: max(0, min(100, int(v)))
            return {"technical": clamp(out.technical), "communication": clamp(out.communication),
                    "confidence": clamp(out.confidence), "comment": out.comment}
        return self.heuristic(answer, resume)

    @staticmethod
    def heuristic(answer, resume):
        words = len(answer.split())
        return {"technical": min(100, 30 + words + 5 * sum(s in answer.lower() for s in resume.get("skills", []))),
                "communication": min(100, 40 + words * 2), "confidence": 70 if words > 15 else 45}

    @staticmethod
    def feedback(breakdown) -> str:
        best, worst = max(breakdown, key=breakdown.get), min(breakdown, key=breakdown.get)
        return f"Strongest area: {best}. Area to improve: {worst}."


class CopilotAgent:
    SYSTEM = ("You convert a recruiter's request about candidates into search filters. "
              "Skills are lowercase (python, react, machine learning). Put a description in semantic_query only when the request "
              "describes a profile without naming specific skills. Default limit is 5.")

    def parse(self, message: str) -> dict:
        out = structured(CopilotFilters, self.SYSTEM, message)
        if out:
            skills = list(dict.fromkeys(norm_skill(s) for s in out.skills if s.strip()))
            return {"limit": max(1, min(20, out.limit)), "skills": skills, "min_score": out.min_score,
                    "location": out.location, "semantic_query": out.semantic_query}
        m = message.lower()
        top = re.search(r"top\s+(\d+)", m)
        score = re.search(r"(?:above|over|>)\s*(\d+)", m)
        skills = find_skills(message)
        return {"limit": max(1, min(20, int(top.group(1)))) if top else 5, "skills": skills,
                "min_score": float(score.group(1)) if score else None, "location": None,
                "semantic_query": "" if skills else message}
