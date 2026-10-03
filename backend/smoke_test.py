import io, os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
from fastapi.testclient import TestClient
from app.main import app
from reportlab.pdfgen import canvas

c = TestClient(app)
def H(t): return {"Authorization": f"Bearer {t}"}
def ok(r, code=200):
    assert r.status_code == code, (r.request.url, r.status_code, r.text); return r.json()

rec = ok(c.post("/api/auth/signup", json={"name": "Rita", "email": "r@x.com", "password": "Passw0rd1", "role": "recruiter"}), 201)
cand = ok(c.post("/api/auth/signup", json={"name": "Arun", "email": "a@x.com", "password": "Passw0rd1", "role": "candidate"}), 201)
assert c.post("/api/auth/login", json={"email": "a@x.com", "password": "wrong"}).status_code == 401
assert c.post("/api/auth/signup", json={"name": "B", "email": "b@x.com", "password": "weak", "role": "candidate"}).status_code == 422
rt, ct = rec["access_token"], cand["access_token"]
job = ok(c.post("/api/jobs", json={"title": "Python Dev", "company": "Acme", "skills": ["python", "fastapi", "sql"], "description": "Build APIs"}, headers=H(rt)), 201)

buf = io.BytesIO(); p = canvas.Canvas(buf)
for i, l in enumerate(["Arun Kumar", "arun@x.com", "Backend Developer with 3 years experience", "Skills: Python, FastAPI, SQL, Docker", "B.Tech Computer Science, VIT University"]):
    p.drawString(60, 780 - 20 * i, l)
p.save()
assert c.post("/api/resume/upload", files={"file": ("cv.txt", b"hello", "text/plain")}, headers=H(ct)).status_code == 400
up = ok(c.post("/api/resume/upload", files={"file": ("cv.pdf", buf.getvalue(), "application/pdf")}, headers=H(ct)))
print("parsed:", up["parsed"])
ok(c.post(f"/api/resume/{up['resume_id']}/confirm", headers=H(ct)))
jobs = ok(c.get("/api/jobs", headers=H(ct))); print("match%:", jobs[0]["match_percent"])
ok(c.post(f"/api/jobs/{job['id']}/apply", headers=H(ct)), 201)
dash = ok(c.get("/api/candidate/dashboard", headers=H(ct))); appid = dash["applications"][0]["application_id"]
s = ok(c.post(f"/api/interview/start/{appid}", headers=H(ct))); sid = s["session_id"]
while True:
    r = ok(c.post(f"/api/interview/{sid}/answer", json={"answer": "I used Python and FastAPI to build REST APIs with SQL databases in production.", "time_taken": 30}, headers=H(ct)))
    if r["done"]: break
print("dashboard:", ok(c.get("/api/candidate/dashboard", headers=H(ct)))["applications"][0]["status"])
lst = ok(c.get(f"/api/recruiter/jobs/{job['id']}/candidates?skill=python", headers=H(rt))); print("ranked:", lst["candidates"][0]["ai_score"], lst["candidates"][0]["breakdown"])
assert c.get(f"/api/recruiter/jobs/{job['id']}/export", headers=H(rt)).text.startswith("Name")
print("copilot:", ok(c.post("/api/copilot/query", json={"message": "show me top 5 python candidates"}, headers=H(rt)))["reply"])
ok(c.post(f"/api/recruiter/applications/{appid}/decision", json={"decision": "shortlisted"}, headers=H(rt)))
print("notifications:", ok(c.get("/api/notifications", headers=H(ct)))["unread_count"])
assert c.get("/api/recruiter/jobs/1/candidates", headers=H(ct)).status_code == 403
print("ALL PASSED")
