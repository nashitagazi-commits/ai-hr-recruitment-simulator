import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from ..models import User, PasswordReset
from ..schemas import SignupIn, LoginIn, ForgotIn, ResetIn
from ..core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role}


@router.post("/signup", status_code=201)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email already registered")
    u = User(name=data.name, email=email, password_hash=hash_password(data.password), role=data.role)
    db.add(u); db.commit(); db.refresh(u)
    return {"access_token": create_access_token(u.id, u.role), "token_type": "bearer", "user": user_out(u)}


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == data.email.lower()).first()
    if not u or not verify_password(data.password, u.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_access_token(u.id, u.role, data.remember_me), "token_type": "bearer", "user": user_out(u)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@router.post("/forgot-password")
def forgot(data: ForgotIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == data.email.lower()).first()
    resp = {"message": "If that email exists, a reset link has been sent."}  # never reveal if email exists
    if u:
        token = secrets.token_urlsafe(32)
        db.add(PasswordReset(user_id=u.id, token=token, expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
        db.commit()
        # TODO: send email (SMTP/SendGrid). In dev we print the link.
        print(f"[DEV] Reset link: http://localhost:5173/reset-password?token={token}")
    return resp


@router.post("/reset-password")
def reset(data: ResetIn, db: Session = Depends(get_db)):
    pr = db.query(PasswordReset).filter(PasswordReset.token == data.token, PasswordReset.used == False).first()  # noqa: E712
    if not pr:
        raise HTTPException(400, "Invalid or expired token")
    exp = pr.expires_at if pr.expires_at.tzinfo else pr.expires_at.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired token")
    db.get(User, pr.user_id).password_hash = hash_password(data.new_password)
    pr.used = True
    db.commit()
    return {"message": "Password updated"}
