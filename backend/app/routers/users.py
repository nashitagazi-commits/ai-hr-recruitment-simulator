from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User
from ..schemas import ChangePasswordIn, NotifPrefsIn
from ..core.security import verify_password, hash_password

router = APIRouter(prefix="/api/users", tags=["settings"])


@router.post("/change-password")
def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated"}


@router.get("/notification-prefs")
def get_prefs(user: User = Depends(get_current_user)):
    return user.notify_prefs


@router.put("/notification-prefs")
def set_prefs(data: NotifPrefsIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.notify_prefs = data.model_dump()
    db.commit()
    return user.notify_prefs
