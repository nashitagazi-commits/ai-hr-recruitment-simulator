from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db import Base, engine
from . import models  # noqa: F401  (register tables)
from .routers import auth, resume, jobs, candidate, interview, recruiter, copilot, notifications, users, settings_compat, ai_status

Base.metadata.create_all(bind=engine)  # for production use Alembic migrations

app = FastAPI(title="AI HR Recruitment Simulator API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in (auth, resume, jobs, candidate, interview, recruiter, copilot, notifications, users, settings_compat, ai_status):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
