# AI HR Recruitment Simulator – Backend (FastAPI + PostgreSQL)

## Run
```bash
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # edit DATABASE_URL / SECRET_KEY
python seed.py                                        # demo recruiter + 4 jobs
uvicorn app.main:app --reload --port 8000
```
Docs (Swagger): http://localhost:8000/docs  |  Test everything: `python smoke_test.py`

PostgreSQL: `createdb hr_simulator`, then in .env  
`DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/hr_simulator`

Demo login: `recruiter@demo.com / Demo1234`. Signup a candidate from the UI.

Auth: every endpoint except signup/login/forgot/reset needs `Authorization: Bearer <token>`.

## Endpoints  (Frontend task -> API)
| Task | Method & Path | Notes |
|---|---|---|
| 2 | POST `/api/auth/signup` | `{name,email,password,role}` -> `{access_token,user}` |
| 2 | POST `/api/auth/login` | `{email,password,remember_me}`; 401 on wrong creds; redirect by `user.role` |
| 2 | POST `/api/auth/forgot-password`, `/reset-password` | reset link printed in server console (dev) |
| 2 | GET `/api/auth/me` | validate token on app load |
| 3 | POST `/api/resume/upload` | multipart field `file` (PDF, 5MB) -> `{resume_id, parsed}` |
| 3 | POST `/api/resume/{id}/confirm` | "Confirm & Continue"; optional edited fields in body |
| 3 | GET `/api/resume/me` | latest resume |
| 4 | GET `/api/candidate/dashboard` | stages + applications + `stage_index` for stepper + overall score ring |
| 4 | GET/PUT `/api/candidate/profile` | name, phone, location, skills |
| 5 | GET `/api/jobs?search=&role=&location=&skill=` | each job has `match_percent`, `applied` |
| 5 | GET `/api/jobs/{id}` | detail |
| 5 | POST `/api/jobs/{id}/apply` | needs confirmed resume |
| 5 | POST `/api/jobs` , GET `/api/jobs/mine` | recruiter creates / lists own jobs |
| 6 | POST `/api/interview/start/{application_id}` | returns messages, `total_questions`, `time_limit` (resumable) |
| 6 | POST `/api/interview/{session_id}/answer` | `{answer,time_taken}` -> next question or `done:true` |
| 6 | GET `/api/interview/{session_id}` | reload chat history |
| 7 | POST `/api/interview/transcribe` | multipart field `audio` -> `{text}` (Whisper) |
| 7 | GET `/api/interview/{sid}/question/{i}/audio` | mp3; 501 => use `speechSynthesis` fallback |
| 8 | GET `/api/recruiter/jobs/{job_id}/candidates?skill=&min_exp=&max_exp=&min_score=&max_score=` | sorted by AI score |
| 8 | GET `/api/recruiter/applications/{id}` | breakdown panel |
| 8 | GET `/api/recruiter/compare?ids=1,2,3` | 2–3 candidates |
| 8 | GET `/api/recruiter/jobs/{job_id}/export` | CSV download |
| 8 | POST `/api/recruiter/applications/{id}/decision` | shortlisted / rejected / hired |
| 9 | POST `/api/copilot/query` | `{message, filters}` -> `{reply, candidates[]}` |
| 10 | GET `/api/notifications`, POST `/read-all`, `/{id}/read` | bell dropdown |
| 10 | POST `/api/users/change-password`, GET/PUT `/api/users/notification-prefs` | settings |

Note: interview route in frontend is `/interview/:candidateId` – pass the **application_id** to `start/{application_id}`.

## Structure
```
app/
  main.py  db.py  models.py  schemas.py  deps.py
  core/      config.py  security.py (JWT + bcrypt)
  routers/   auth resume jobs candidate interview recruiter copilot notifications users
  services/  ai.py   <-- ALL AI plug-in points live here
```

## For the AI team  (edit ONLY `app/services/ai.py`, keep signatures)
| Function | Replace with |
|---|---|
| `parse_resume(text)` | LLM/NER structured extraction |
| `match_score(...)` | Sentence-Transformers embeddings + cosine similarity (ChromaDB) |
| `index_resume(user_id, text)` | chunk + embed + upsert to ChromaDB for RAG |
| `generate_questions(...)` | RAG + GPT/LangChain interview agent |
| `evaluate_answer(...)` / `final_feedback(...)` | Evaluation agent (technical / communication / confidence 0-100) |
| `transcribe_audio(...)` / `text_to_speech(...)` | Whisper / TTS |
| `copilot_parse(message)` | LLM function-calling for HR Copilot |
