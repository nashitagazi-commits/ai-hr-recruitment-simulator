from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user, candidate_only, recruiter_only
from ..models import User, Job, Application, Resume, Notification, InterviewSession, InterviewMessage
from ..schemas import JobIn
from ..services import ai
from .resume import latest

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _match_for(db: Session, user: User, job: Job) -> float | None:
    if user.role != "candidate":
        return None
    r = latest(db, user.id)
    skills = (r.parsed.get("skills") if r else None) or user.skills or []
    return ai.match_score(skills, r.raw_text if r else "", job.skills, job.description)


def job_out(job: Job, match: float | None = None, applied: bool = False) -> dict:
    return {"id": job.id, "title": job.title, "company": job.company, "location": job.location,
            "role_type": job.role_type, "description": job.description, "requirements": job.requirements,
            "skills": job.skills, "match_percent": match, "applied": applied,
            "created_at": job.created_at.isoformat()}


@router.get("")
def list_jobs(search: str | None = None, role: str | None = None, location: str | None = None,
              skill: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Job)
    if search:
        q = q.filter(Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%"))
    if role:
        q = q.filter(Job.title.ilike(f"%{role}%"))
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))
    jobs = q.order_by(Job.id.desc()).all()
    if skill:
        jobs = [j for j in jobs if skill.lower() in [s.lower() for s in j.skills]]
    applied = {a.job_id for a in db.query(Application).filter(Application.candidate_id == user.id)} if user.role == "candidate" else set()
    out = [job_out(j, _match_for(db, user, j), j.id in applied) for j in jobs]
    if user.role == "candidate":
        out.sort(key=lambda j: j["match_percent"] or 0, reverse=True)
    return out


@router.get("/mine")
def my_jobs(user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    return [job_out(j) for j in db.query(Job).filter(Job.recruiter_id == user.id).order_by(Job.id.desc())]


@router.get("/{job_id}")
def get_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    applied = user.role == "candidate" and db.query(Application).filter_by(candidate_id=user.id, job_id=j.id).first() is not None
    return job_out(j, _match_for(db, user, j), applied)


@router.post("", status_code=201)
def create_job(data: JobIn, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    j = Job(recruiter_id=user.id, **data.model_dump())
    db.add(j); db.commit(); db.refresh(j)
    return job_out(j)


@router.post("/{job_id}/apply", status_code=201)
def apply(job_id: int, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    r = latest(db, user.id)
    if not r or not r.confirmed:
        raise HTTPException(400, "Upload and confirm your resume before applying")
    if db.query(Application).filter_by(candidate_id=user.id, job_id=job_id).first():
        raise HTTPException(409, "Already applied")
    a = Application(candidate_id=user.id, job_id=job_id, match_score=_match_for(db, user, j) or 0)
    db.add(a)
    db.add(Notification(user_id=user.id, message=f"Application submitted for {j.title} at {j.company}"))
    db.add(Notification(user_id=j.recruiter_id, message=f"{user.name} applied for {j.title}"))
    db.commit(); db.refresh(a)
    return {"application_id": a.id, "match_percent": a.match_score, "status": a.status}


@router.put("/{job_id}")
def update_job(job_id: int, data: JobIn, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if not j or j.recruiter_id != user.id:
        raise HTTPException(404, "Job not found")
    for key, value in data.model_dump().items():
        setattr(j, key, value)
    db.commit()
    db.refresh(j)
    return job_out(j)


@router.delete("/{job_id}")
def delete_job(job_id: int, force: bool = False, user: User = Depends(recruiter_only), db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if not j or j.recruiter_id != user.id:
        raise HTTPException(404, "Job not found")
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    if apps and not force:
        raise HTTPException(409, f"{len(apps)} candidate(s) have applied to this job. Deleting it also removes their applications and interviews.")
    for a in apps:
        s = db.query(InterviewSession).filter_by(application_id=a.id).first()
        if s:
            db.query(InterviewMessage).filter_by(session_id=s.id).delete()
            db.delete(s)
        db.add(Notification(user_id=a.candidate_id, message=f"The position {j.title} at {j.company} is no longer available"))
        db.delete(a)
    db.delete(j)
    db.commit()
    return {"message": "Job deleted", "removed_applications": len(apps)}

