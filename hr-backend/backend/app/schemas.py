import re
from pydantic import BaseModel, EmailStr, field_validator, Field


def _strong(pw: str) -> str:
    if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise ValueError("Password must be 8+ characters with letters and numbers")
    return pw


class SignupIn(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str
    role: str

    _pw = field_validator("password")(_strong)

    @field_validator("role")
    @classmethod
    def _role(cls, v):
        if v not in ("candidate", "recruiter"):
            raise ValueError("role must be candidate or recruiter")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str
    _pw = field_validator("new_password")(_strong)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str
    _pw = field_validator("new_password")(_strong)


class ProfileIn(BaseModel):
    name: str | None = None
    phone: str | None = None
    location: str | None = None
    skills: list[str] | None = None


class JobIn(BaseModel):
    title: str
    company: str
    location: str = "Remote"
    role_type: str = "Full-time"
    description: str
    requirements: list[str] = []
    skills: list[str] = []


class AnswerIn(BaseModel):
    answer: str
    time_taken: int | None = None  # seconds


class DecisionIn(BaseModel):
    decision: str  # shortlisted | rejected | hired


class CopilotIn(BaseModel):
    message: str
    filters: dict = {}  # {"skill": "python", "min_score": 70, "location": "Bengaluru"}


class NotifPrefsIn(BaseModel):
    email: bool = True
    interview: bool = True
    status: bool = True
