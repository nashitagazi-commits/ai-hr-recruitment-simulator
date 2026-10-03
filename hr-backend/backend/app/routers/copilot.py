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
    skills = parsed["skills"] + ([f["skill"].lower()] if f.get("skill") else [])
    min_score = f.get("min_score", parsed["min_score"])
    apps = (db.query(Application).join(Job).filter(Job.recruiter_id == user.id).all())
    rows = [card(db, a) for a in apps]
    if skills:
        rows = [c for c in rows if all(s in [x.lower() for x in c["skills"]] for s in skills)]
    if f.get("location"):
        rows = [c for c in rows if (c["location"] or "").lower() == f["location"].lower()]
    score = lambda c: c["ai_score"] if c["ai_score"] is not None else c["match_percent"]
    if min_score is not None:
        rows = [c for c in rows if score(c) >= float(min_score)]
    rows.sort(key=score, reverse=True)
    rows = rows[: parsed["limit"]]
    label = f"top {len(rows)} " + (", ".join(skills) + " " if skills else "") + "candidates"
    reply = f"Here are the {label}." if rows else "I couldn't find candidates matching that. Try relaxing the filters."
    return {"reply": reply, "candidates": [{"application_id": c["application_id"], "name": c["name"], "score": score(c),
            "skills": c["skills"][:6], "location": c["location"]} for c in rows]}
