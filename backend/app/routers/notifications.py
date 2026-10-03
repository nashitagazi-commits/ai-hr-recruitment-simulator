from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.id.desc()).limit(30).all()
    return {"unread_count": sum(1 for n in q if not n.read),
            "items": [{"id": n.id, "message": n.message, "read": n.read, "created_at": n.created_at.isoformat()} for n in q]}


@router.post("/read-all")
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.read == False).update({"read": True})  # noqa: E712
    db.commit()
    return {"message": "ok"}


@router.post("/{nid}/read")
def read_one(nid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, nid)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Not found")
    n.read = True
    db.commit()
    return {"message": "ok"}
