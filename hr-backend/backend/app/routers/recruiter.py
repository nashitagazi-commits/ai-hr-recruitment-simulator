import csv, io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..deps import get_db, recruiter_only
from ..models import User, Job, Application, Resume, Notification
from ..schemas import DecisionIn
from .resume import latest

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


def card(db: Session, a: Application) -> dict:
    r = latest(db, a.candidate_id)
    p = r.parsed if r else {}
    return {"application_id": a.id, "candidate_id": a.candidate_id, "name": a.candidate.name, "email": a.candidate.email,
            "location": a.candidate.location, "skills": p.get("skills", a.candidate.skills or []),
            "experience_years": p.get("experience_years", 0), "match_percent": a.match_score,
            "ai_score": a.ai_score, "breakdown": a.score_breakdown, "status": a.status,
            "decision": a.decision, "feedback": a.feedback}


def ranked(db: Session, recruiter: User, job_id: int, skill=None, min_exp=None, max_exp=None, min_score=None, max_score=None):
    job = db.get(Job, job_id)
    if not job or job.recruiter_id != recruiter.id:
        raise HTTPException(404, "Job not found")
    rows = [card(db, a) for a in db.query(Application).filter(Application.job_id == job_id)]
    if skill:
        rows = [c for c in rows if skill.lower() in [s.lower() for s in c["skills"]]]
    if min_exp is not None:
        rows = [c for c in rows if c["experience_years"] >= min_exp]
    if max_exp is not None:
        rows = [c for c in rows if c["experience_years"] <= max_exp]
    key = lambda c: c["ai_score"] if c["ai_score"] is not None else c["match_percent"]
    if min_score is not None:
        rows = [c for c in rows if key(c) >= min_score]
    if max_score is not None:
        rows = [c for c in rows if key(c) <= max_score]
    rows.sort(key=lambda c: (c["ai_score"] is not None, key(c)), reverse=True)  # interviewed first, highest first
    return job, rows


@router.get("/jobs/{job_id}/candidates")
def candidates(job_id: int, skill: str | None = None, min_exp: float | None = None, max_exp: float | None = None,
               min_score: float | None = None, max_score: float | None = None,
               user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    job, rows = ranked(db, user, job_id, skill, min_exp, max_exp, min_score, max_score)
    return {"job": {"id": job.id, "title": job.title}, "count": len(rows), "candidates": rows}


@router.get("/jobs/{job_id}/export")
def export_csv(job_id: int, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    _, rows = ranked(db, user, job_id)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Name", "Email", "Skills", "Experience (yrs)", "Match %", "AI Score", "Technical", "Communication", "Confidence", "Status"])
    for c in rows:
        b = c["breakdown"] or {}
        w.writerow([c["name"], c["email"], "; ".join(c["skills"]), c["experience_years"], c["match_percent"], c["ai_score"],
                    b.get("technical"), b.get("communication"), b.get("confidence"), c["status"]])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename=candidates_job_{job_id}.csv"})


@router.get("/applications/{application_id}")
def detail(application_id: int, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    a = db.get(Application, application_id)
    if not a or a.job.recruiter_id != user.id:
        raise HTTPException(404, "Application not found")
    return card(db, a)


@router.get("/compare")
def compare(ids: str = Query(..., description="comma-separated application ids, 2-3"),
            user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    try:
        id_list = [int(i) for i in ids.split(",")]
    except ValueError:
        raise HTTPException(400, "ids must be integers")
    if not 2 <= len(id_list) <= 3:
        raise HTTPException(400, "Select 2 or 3 candidates")
    out = []
    for i in id_list:
        a = db.get(Application, i)
        if not a or a.job.recruiter_id != user.id:
            raise HTTPException(404, f"Application {i} not found")
        out.append(card(db, a))
    return out


@router.post("/applications/{application_id}/decision")
def decide(application_id: int, data: DecisionIn, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    if data.decision not in ("shortlisted", "rejected", "hired"):
        raise HTTPException(400, "Invalid decision")
    a = db.get(Application, application_id)
    if not a or a.job.recruiter_id != user.id:
        raise HTTPException(404, "Application not found")
    a.decision, a.status = data.decision, "result"
    db.add(Notification(user_id=a.candidate_id, message=f"Update on {a.job.title}: you have been {data.decision}"))
    db.commit()
    return {"message": "Decision saved", "decision": a.decision}
