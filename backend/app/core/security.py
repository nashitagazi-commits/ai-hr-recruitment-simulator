from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from .config import settings

ALGO = "HS256"


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except ValueError:
        return False


def create_access_token(user_id: int, role: str, remember: bool = False) -> str:
    minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES * (30 if remember else 1)
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": exp}, settings.SECRET_KEY, algorithm=ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
