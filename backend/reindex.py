"""Index every stored resume into ChromaDB (run once after installing the AI packages):  python reindex.py"""
from app.db import SessionLocal
from app.models import Resume
from app.services import ai

db = SessionLocal()
n = 0
for r in db.query(Resume).all():
    ai.index_resume(r.user_id, r.raw_text)
    n += 1
print(f"Indexed {n} resume(s)")
