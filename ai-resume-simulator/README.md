# AI HR Recruitment Simulator 🤖📄

An AI-powered hiring platform designed to transform recruitment into a smarter, faster, and more data-driven process. This project helps HR teams review resumes, evaluate candidates, match them to job roles, and interact with an intelligent recruiter assistant.

## 🌟 Overview

AI HR Recruitment Simulator brings together resume analysis, candidate evaluation, and recruiter assistance in a single modern platform. It helps hiring teams make informed decisions with less manual effort and better speed.

## ✨ Key Features

- Resume-based candidate evaluation 📄
- AI-driven job matching and ranking 🎯
- Recruiter dashboard for hiring insights 📊
- HR Copilot assistant for natural-language queries 💬
- Candidate filtering by skills, score, and location 🧠
- Modern and responsive user interface for HR teams 🖥️
- Scalable frontend architecture for future backend integration 🔧

## 🏗️ Tech Stack

- React.js ⚛️
- Vite ⚡
- React Router DOM 🧭
- JavaScript / JSX 💻
- CSS styling 🎨
- API-ready frontend structure 🔌

## 🚀 Project Goals

- Reduce manual screening time ⏱️
- Improve recruitment accuracy with AI-assisted evaluation 🧠
- Build a recruiter-friendly user experience 👩‍💼
- Create a scalable project for future AI and backend integration 🤝

## 🧩 Core Modules

- Authentication and user access 🔐
- Candidate dashboard and evaluation 📋
- Job matching and ranking 🧾
- HR Copilot assistant 🤖
- Recruiter filtering and shortlist workflow 🧑‍💼

## 📁 Project Structure

```bash
src/
├── App.jsx
├── main.jsx
├── Routes/
├── pages/
├── components/
├── Hooks/
├── Services/
├── context/
├── data/
└── assets/
```

## 🛠️ Getting Started

### Install dependencies

```bash
npm install
```

### Run the project locally

```bash
npm run dev
```

Then open:

```bash
http://localhost:5173
```

## 🤖 HR Copilot Feature

The HR Copilot interface allows recruiters to ask natural-language questions such as:

- Show me top Python candidates 🐍
- Who are the best React developers? ⚛️
- Candidates with score above 85 📈
- Top candidates in Chennai 📍

This feature helps recruiters quickly explore candidate matches and shortlist suitable applicants using conversational prompts.

## 📌 Future Enhancements

- Real AI backend integration 🤖
- Resume parsing using NLP and ML 🧠
- Interview scheduling automation 📅
- Candidate analytics dashboard 📈
- Enhanced recruiter insights and reporting 📊

## Task 10 API integration

The settings and notification screens use the API base URL from `VITE_API_BASE_URL` (defaults to `http://localhost:8000`) and send a bearer token from `localStorage` under `token` when present. The backend must provide:

- `GET /api/notifications` returning an array or `{ "notifications": [] }` with `id`, `title` or `message`, optional `created_at`, and `read` or `is_read`.
- `PATCH /api/notifications/{id}/read` to mark a notification read.
- `GET /api/settings` returning notification preferences.
- `PATCH /api/settings/notifications` accepting `{ "email": boolean, "in_app": boolean, "interview_updates": boolean }`.
- `POST /api/auth/change-password` accepting `{ "current_password": string, "new_password": string }`.
- `POST /api/copilot/query` accepting the query, filters, and history described in `src/Services/copilotService.js`.

Add `VITE_API_BASE_URL=https://your-api-host` to the local `.env` file. Copilot uses the API by default; set `VITE_USE_MOCK=true` only to opt into its local sample data. These endpoints are an integration contract for the backend; the repository does not include a backend server, so live API behavior must be verified against the deployed service.

## 🤝 Team Contribution

This project is built as a collaborative effort across frontend, backend, and AI modules to create a complete digital hiring ecosystem.

## ⭐ Mission

To make hiring smarter, faster, and more efficient through the power of AI and intuitive design.
