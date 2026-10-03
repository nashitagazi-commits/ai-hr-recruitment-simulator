from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from .db import SessionLocal
from .models import User
from .core.security import decode_token

bearer = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, "User not found")
    return user


def candidate_only(user: User = Depends(get_current_user)) -> User:
    if user.role != "candidate":
        raise HTTPException(403, "Candidates only")
    return user


def recruiter_only(user: User = Depends(get_current_user)) -> User:
    if user.role != "recruiter":
        raise HTTPException(403, "Recruiters only")
    return user
