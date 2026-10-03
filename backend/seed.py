"""Run once:  python seed.py   ->  creates demo recruiter + jobs for the demo."""
from app.db import SessionLocal, Base, engine
from app.models import User, Job
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()
if not db.query(User).filter_by(email="recruiter@demo.com").first():
    rec = User(name="Demo Recruiter", email="recruiter@demo.com", password_hash=hash_password("Demo1234"), role="recruiter")
    db.add(rec); db.flush()
    jobs = [
        ("Python Backend Developer", "TechNova", "Bengaluru", ["python", "fastapi", "postgresql", "docker"]),
        ("React Frontend Developer", "PixelWorks", "Remote", ["react", "javascript", "tailwind", "css"]),
        ("ML Engineer", "DataMind AI", "Hyderabad", ["python", "machine learning", "pytorch", "nlp"]),
        ("Full Stack Engineer", "CloudBase", "Pune", ["react", "node", "sql", "aws"]),
    ]
    for t, c, loc, sk in jobs:
        db.add(Job(recruiter_id=rec.id, title=t, company=c, location=loc, skills=sk,
                   description=f"We are hiring a {t}. You will build and ship production features.",
                   requirements=[f"Experience with {s}" for s in sk]))
    db.commit()
    print("Seeded: recruiter@demo.com / Demo1234 + 4 jobs")
else:
    print("Already seeded")
