from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..deps import get_db, candidate_only
from ..models import User, Application
from ..schemas import ProfileIn
from .resume import latest

router = APIRouter(prefix="/api/candidate", tags=["candidate"])
STAGES = ["applied", "screened", "interviewed", "result"]


def profile_out(u: User, db: Session) -> dict:
    r = latest(db, u.id)
    apps = db.query(Application).filter(Application.candidate_id == u.id).all()
    overall = round(sum(a.match_score for a in apps) / len(apps), 1) if apps else 0
    return {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone, "location": u.location,
            "skills": u.skills or [], "resume": {"filename": r.filename, "parsed": r.parsed} if r else None,
            "overall_match_score": overall}


@router.get("/profile")
def get_profile(user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    return profile_out(user, db)


@router.put("/profile")
def update_profile(data: ProfileIn, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    return profile_out(user, db)


@router.get("/dashboard")
def dashboard(user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.candidate_id == user.id).order_by(Application.id.desc()).all()
    return {
        "stages": STAGES,
        "overall_match_score": profile_out(user, db)["overall_match_score"],
        "applications": [{
            "application_id": a.id, "job_id": a.job_id, "job_title": a.job.title, "company": a.job.company, "location": a.job.location, "location": a.job.location,
            "status": a.status, "stage_index": STAGES.index(a.status), "match_percent": a.match_score,
            "ai_score": a.ai_score, "decision": a.decision, "feedback": a.feedback,
            "applied_at": a.created_at.isoformat(),
        } for a in apps],
    }


