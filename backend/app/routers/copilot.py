from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, recruiter_only
from ..models import User, Job, Application
from ..schemas import CopilotIn
from ..services import ai
from .recruiter import card

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


@router.post("/query")
def query(data: CopilotIn, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    parsed = ai.copilot_parse(data.message)
    f = data.filters or {}
    skills = list(dict.fromkeys(parsed["skills"] + ([f["skill"].lower()] if f.get("skill") else [])))
    min_score = f.get("min_score", parsed["min_score"])
    location = f.get("location") or parsed.get("location")

    apps = db.query(Application).join(Job).filter(Job.recruiter_id == user.id).all()
    rows = [card(db, a) for a in apps]
    if skills:
        rows = [c for c in rows if all(s in [x.lower() for x in c["skills"]] for s in skills)]
    if location:
        rows = [c for c in rows if (c["location"] or "").lower() == location.lower()]
    score = lambda c: c["ai_score"] if c["ai_score"] is not None else c["match_percent"]
    if min_score is not None:
        rows = [c for c in rows if score(c) >= float(min_score)]

    sim = {}
    if parsed.get("semantic_query") and not skills:  # profile described in words -> semantic search over resumes
        sim = ai.semantic_rank(parsed["semantic_query"], {c["candidate_id"] for c in rows})
    if sim:
        rows.sort(key=lambda c: sim.get(c["candidate_id"], -1), reverse=True)
    else:
        rows.sort(key=score, reverse=True)

    seen, unique = set(), []
    for c in rows:  # a candidate may have applied to several jobs: keep the best row
        if c["candidate_id"] not in seen:
            seen.add(c["candidate_id"])
            unique.append(c)
    rows = unique[: parsed["limit"]]

    label = (", ".join(skills) + " " if skills else "") + "candidates"
    reply = f"Here are the top {len(rows)} {label}." if rows else "I couldn't find candidates matching that. Try relaxing the filters."
    return {"reply": reply, "candidates": [{
        "application_id": c["application_id"], "name": c["name"], "score": score(c), "skills": c["skills"][:6],
        "location": c["location"], "experience_years": c["experience_years"], "summary": c["feedback"] or ""} for c in rows]}
