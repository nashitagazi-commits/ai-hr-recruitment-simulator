from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # candidate | recruiter
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    notify_prefs: Mapped[dict] = mapped_column(JSON, default=lambda: {"email": True, "interview": True, "status": True})
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class PasswordReset(Base):
    __tablename__ = "password_resets"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)


class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(String(500))
    raw_text: Mapped[str] = mapped_column(Text, default="")
    parsed: Mapped[dict] = mapped_column(JSON, default=dict)  # name, skills, experience, education, experience_years
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    company: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(120), default="Remote")
    role_type: Mapped[str] = mapped_column(String(80), default="Full-time")
    description: Mapped[str] = mapped_column(Text)
    requirements: Mapped[list] = mapped_column(JSON, default=list)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("candidate_id", "job_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="applied")  # applied|screened|interviewed|result
    match_score: Mapped[float] = mapped_column(Float, default=0)  # resume<->job similarity (0-100)
    ai_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # final interview score
    score_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)  # technical/communication/confidence
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    decision: Mapped[str | None] = mapped_column(String(20), nullable=True)  # shortlisted|rejected|hired
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    candidate: Mapped[User] = relationship()
    job: Mapped[Job] = relationship()


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), unique=True)
    questions: Mapped[list] = mapped_column(JSON, default=list)
    current_index: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress|completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    messages: Mapped[list["InterviewMessage"]] = relationship(order_by="InterviewMessage.id")


class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), index=True)
    sender: Mapped[str] = mapped_column(String(10))  # ai | candidate
    text: Mapped[str] = mapped_column(Text)
    question_index: Mapped[int] = mapped_column(Integer, default=0)
    scores: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(String(500))
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
