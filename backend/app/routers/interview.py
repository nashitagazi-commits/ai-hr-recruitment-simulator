from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from ..deps import get_db, candidate_only
from ..models import User, Application, InterviewSession, InterviewMessage, Notification
from ..schemas import AnswerIn
from ..services import ai
from .resume import latest

router = APIRouter(prefix="/api/interview", tags=["interview"])
QUESTION_TIME_LIMIT = 60
TOTAL_QUESTIONS = 8


def _own_session(db: Session, sid: int, user: User) -> InterviewSession:
    s = db.get(InterviewSession, sid)
    if not s:
        raise HTTPException(404, "Interview not found")
    app = db.get(Application, s.application_id)
    if app.candidate_id != user.id:
        raise HTTPException(403, "Not your interview")
    return s


def _state(s: InterviewSession) -> dict:
    return {"session_id": s.id, "status": s.status, "current_index": s.current_index,
            "total_questions": len(s.questions), "time_limit": QUESTION_TIME_LIMIT,
            "messages": [{"id": m.id, "sender": m.sender, "text": m.text, "question_index": m.question_index} for m in s.messages]}


@router.post("/start/{application_id}")
def start(application_id: int, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    a = db.get(Application, application_id)
    if not a or a.candidate_id != user.id:
        raise HTTPException(404, "Application not found")
    s = db.query(InterviewSession).filter_by(application_id=a.id).first()
    if s:  # resume an existing interview
        return _state(s)
    r = latest(db, user.id)
    qs = ai.generate_questions(r.parsed if r else {}, a.job.title, a.job.skills, TOTAL_QUESTIONS,
                                user_id=user.id, job_description=a.job.description)
    s = InterviewSession(application_id=a.id, questions=qs)
    db.add(s); db.flush()
    db.add(InterviewMessage(session_id=s.id, sender="ai", text=qs[0], question_index=0))
    a.status = "screened"
    db.add(Notification(user_id=user.id, message=f"Your interview for {a.job.title} has started"))
    db.commit(); db.refresh(s)
    return _state(s)


@router.get("/{session_id}")
def get_session(session_id: int, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    return _state(_own_session(db, session_id, user))


@router.post("/{session_id}/answer")
def answer(session_id: int, data: AnswerIn, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    s = _own_session(db, session_id, user)
    if s.status == "completed":
        raise HTTPException(400, "Interview already completed")
    idx = s.current_index
    r = latest(db, user.id)
    text = data.answer.strip() or "(no answer)"
    scores = ai.evaluate_answer(s.questions[idx], text, r.parsed if r else {}, data.time_taken)
    db.add(InterviewMessage(session_id=s.id, sender="candidate", text=text, question_index=idx, scores=scores))
    s.current_index = idx + 1

    if s.current_index >= len(s.questions):
        s.status = "completed"
        rows = [m.scores for m in s.messages if m.sender == "candidate" and m.scores] + [scores]
        bd = {k: round(sum(x[k] for x in rows) / len(rows), 1) for k in ("technical", "communication", "confidence")}
        a = db.get(Application, s.application_id)
        a.score_breakdown = bd
        a.ai_score = round(0.5 * bd["technical"] + 0.3 * bd["communication"] + 0.2 * bd["confidence"], 1)
        a.feedback = ai.final_feedback(bd)
        a.status = "interviewed"
        db.add(Notification(user_id=user.id, message=f"Interview for {a.job.title} completed. Results pending."))
        db.add(Notification(user_id=a.job.recruiter_id, message=f"{user.name} completed the interview for {a.job.title} (score {a.ai_score})"))
        db.commit()
        return {"done": True, "message": "Interview complete. Thank you! The recruiter will review your results.", "next_question": None}

    nxt = s.questions[s.current_index]
    db.add(InterviewMessage(session_id=s.id, sender="ai", text=nxt, question_index=s.current_index))
    db.commit()
    return {"done": False, "next_question": nxt, "current_index": s.current_index, "total_questions": len(s.questions)}


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), user: User = Depends(candidate_only)):
    data = await audio.read()
    if not data:
        raise HTTPException(400, "Empty audio")
    text = ai.transcribe_audio(data, audio.filename or "audio.webm")
    if text.startswith("[Could not"):
        raise HTTPException(503, "Speech recognition is not available right now. Please type your answer.")
    return {"text": text}


@router.get("/{session_id}/question/{index}/audio")
def question_audio(session_id: int, index: int, user: User = Depends(candidate_only), db: Session = Depends(get_db)):
    s = _own_session(db, session_id, user)
    if index < 0 or index >= len(s.questions):
        raise HTTPException(404, "No such question")
    audio = ai.text_to_speech(s.questions[index])
    if audio is None:  # frontend should fall back to window.speechSynthesis using the text
        raise HTTPException(501, "TTS not configured - use browser speech synthesis")
    return Response(content=audio, media_type="audio/mpeg")

