import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..deps import get_db, candidate_only
from ..models import User, Resume
from ..core.config import settings
from ..services import ai

router = APIRouter(prefix="/api/resume", tags=["resume"])


def latest(db: Session, user_id: int) -> Resume | None:
    return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.id.desc()).first()


@router.post("/upload")
async def upload(file: UploadFile = File(...), user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    content = await file.read()
    if not (file.filename or "").lower().endswith(".pdf") or not content.startswith(b"%PDF"):
        raise HTTPException(400, "Only PDF files are allowed")
    if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"File too large (max {settings.MAX_UPLOAD_MB} MB)")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4().hex}.pdf")
    with open(path, "wb") as f:
        f.write(content)
    try:
        text = ai.extract_pdf_text(path)
    except Exception:
        raise HTTPException(422, "Could not read this PDF. Try another file.")
    if not text.strip():
        raise HTTPException(422, "No readable text found (scanned PDF?)")
    parsed = ai.parse_resume(text)
    r = Resume(user_id=user.id, filename=file.filename, path=path, raw_text=text, parsed=parsed)
    db.add(r); db.commit(); db.refresh(r)
    ai.index_resume(user.id, text)
    return {"resume_id": r.id, "parsed": parsed}


@router.get("/me")
def my_resume(user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    r = latest(db, user.id)
    if not r:
        raise HTTPException(404, "No resume uploaded yet")
    return {"resume_id": r.id, "filename": r.filename, "parsed": r.parsed, "confirmed": r.confirmed}


@router.post("/{resume_id}/confirm")
def confirm(resume_id: int, edits: dict | None = None, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    r = db.get(Resume, resume_id)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Resume not found")
    if edits:
        r.parsed = {**r.parsed, **{k: v for k, v in edits.items() if k in r.parsed}}
    r.confirmed = True
    # sync skills to profile
    user.skills = sorted(set(user.skills or []) | set(r.parsed.get("skills", [])))
    if not user.name and r.parsed.get("name"):
        user.name = r.parsed["name"]
    db.commit()
    return {"message": "Resume confirmed", "parsed": r.parsed}
