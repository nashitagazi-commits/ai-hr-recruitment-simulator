"""Compatibility routes so the existing Settings page / old services work unchanged."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, Notification
from ..schemas import ChangePasswordIn
from ..core.security import verify_password, hash_password

router = APIRouter(tags=["settings-compat"])


@router.get("/api/settings")
def get_settings(user: User = Depends(get_current_user)):
    prefs = user.notify_prefs or {}
    return {"name": user.name, "email": user.email, "role": user.role,
            "notification_preferences": prefs, "notifications": prefs}


@router.patch("/api/settings/notifications")
@router.put("/api/settings/notifications")
def update_notification_settings(prefs: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.notify_prefs = {**(user.notify_prefs or {}), **prefs}  # new dict so SQLAlchemy sees the change
    db.commit()
    return user.notify_prefs


@router.post("/api/auth/change-password")
def change_password_alias(data: ChangePasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated"}


@router.patch("/api/notifications/{nid}/read")
def mark_read_alias(nid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, nid)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Not found")
    n.read = True
    db.commit()
    return {"message": "ok"}
