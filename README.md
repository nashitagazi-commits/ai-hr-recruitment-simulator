# AI HR Recruitment Simulator

An AI-powered hiring platform: resume parsing, semantic job matching, a RAG-grounded AI interview with voice,
automated scoring, and a recruiter dashboard with an HR Copilot.

**Stack:** React + Tailwind (frontend) - FastAPI + PostgreSQL (backend) - OpenAI GPT, LangChain, ChromaDB,
Sentence Transformers, spaCy, Whisper (AI layer).

## Project structure
- `backend/` - FastAPI app (`app/`), seed scripts, tests
- `ai-resume-simulator/` - React frontend

## 1. Database (Docker)
    docker run --name hr-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hr_simulator -p 5432:5432 -v hr_pgdata:/var/lib/postgresql/data -d postgres:16
Next time: `docker start hr-postgres`

## 2. Backend + AI
    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    pip install -r requirements-ai.txt
    python -m spacy download en_core_web_sm
    copy .env.example .env
    python seed.py
    python add_jobs.py
    uvicorn app.main:app --reload --reload-dir app --port 8000

Edit `.env`:

    DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/hr_simulator
    SECRET_KEY=<long random text>
    OPENAI_API_KEY=            (optional: enables GPT questions, scoring and TTS)

Without an OpenAI key the app still works using rule-based fallbacks. Never commit `.env`.
API docs: http://localhost:8000/docs

## 3. Frontend
    cd ai-resume-simulator
    npm install
    echo VITE_API_URL=http://localhost:8000 > .env
    npm run dev
Open http://localhost:5173

## Demo account
Recruiter: `recruiter@demo.com` / `Demo1234`. Sign up a candidate from the UI.

## Tests
    cd backend
    python smoke_test.py
    python test_ai_layer.py
