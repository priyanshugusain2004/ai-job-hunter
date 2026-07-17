# AI Job Hunter — Architecture

## 1. High-Level Overview

AI Job Hunter is a self-hosted, free-to-run platform that helps a user manage their job
search: store a master resume, tailor it per job, generate cover letters, analyze a
GitHub profile, score job matches, track applications, and prep for interviews.

Everything runs locally via Docker Compose. The only external dependency that costs
money at scale is the AI provider (Google Gemini), which has a usable free tier for
personal use. All other services (Postgres, Redis, n8n, FastAPI, React) are open-source
and free to self-host.

```
┌─────────────┐      HTTPS       ┌──────────────┐        ┌──────────────┐
│   Frontend   │ ───────────────▶│   Backend     │──────▶ │  PostgreSQL  │
│ React+Vite   │◀─────────────── │   FastAPI     │◀────── │   (data)     │
└─────────────┘      JSON/REST   └──────┬───────┘        └──────────────┘
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                    ┌──────────┐   ┌────────────┐   ┌─────────────┐
                    │  Redis   │   │ AI Provider │   │  n8n        │
                    │ (cache/  │   │  Layer      │   │ (automation │
                    │  jobs)   │   │ (Gemini →   │   │  workflows) │
                    └──────────┘   │  OpenAI →   │   └─────────────┘
                                    │  Local LLM) │
                                    └────────────┘
```

## 2. Core Design Principles

1. **AI-provider agnostic** — no business logic calls Gemini directly. Everything goes
   through an `AIProvider` interface so switching to OpenAI/local LLM later is a config
   change, not a rewrite.
2. **Fail gracefully without paid keys** — if no AI key is configured, AI-dependent
   features degrade to "not available" responses instead of crashing the app. Non-AI
   features (resume storage, application tracker, GitHub stats) always work.
3. **Free-tier realistic** — job discovery is designed as a pluggable `JobSource`
   interface. No promise of a magic "search every job board" scraper — that's not free
   or reliable. Default source: manual job-description paste. Optional source: a
   free-tier job API adapter (e.g., Adzuna) the user can enable with their own key.
4. **Stateless backend, stateful Postgres** — horizontally scalable in theory, single
   container in practice for a personal tool.
5. **Modular monolith, not microservices** — one FastAPI app with clean internal module
   boundaries (`api/`, `services/`, `ai/`, `models/`). Microservices would add ops
   overhead with no benefit at this scale.

## 3. System Components

### 3.1 Frontend (React + TypeScript + Vite + Tailwind)
- SPA, talks to backend only via REST (`/api/v1/...`).
- Auth token (JWT) stored in memory + httpOnly refresh cookie (not localStorage, to
  reduce XSS token theft risk).
- Pages map 1:1 to features (see `development_plan.md`).

### 3.2 Backend (FastAPI)
- Layered structure:
  - `api/` — route handlers, request/response models only. No business logic.
  - `services/` — business logic (resume parsing, scoring, tracking).
  - `ai/` — provider-agnostic AI orchestration layer.
  - `models/` — SQLAlchemy ORM models.
  - `database/` — session/engine setup, migrations (Alembic).
  - `tests/` — pytest suite, one test module per service.

### 3.3 AI Layer (`ai/`)
```
ai/
  base.py            # AIProvider abstract interface
  gemini_provider.py # GeminiProvider(AIProvider)
  openai_provider.py # OpenAIProvider(AIProvider)  (stub, for future)
  local_provider.py  # LocalLLMProvider(AIProvider) (stub, for future)
  factory.py          # get_provider() reads AI_PROVIDER env var
  prompts/            # versioned prompt templates per feature
```
`AIProvider` exposes a small set of task-specific methods
(`tailor_resume`, `generate_cover_letter`, `analyze_github`, `score_job_match`,
`generate_interview_questions`, `career_advice`) rather than a raw "chat" passthrough —
this keeps prompt engineering centralized and testable, and makes provider-swapping
safe (each provider must implement the same contract).

### 3.4 Database (PostgreSQL)
See `database_design.md`. Alembic manages migrations from day one.

### 3.5 Cache/Queue (Redis)
- Caches: GitHub API responses (rate-limit friendly), AI responses keyed by input hash
  (avoid re-billing/re-limiting identical requests), job-match scores.
- Also used as the broker for background jobs (resume parsing, AI calls) via a simple
  task queue (FastAPI `BackgroundTasks` initially; upgrade path to Celery/RQ if needed
  later — not required for personal-scale use).

### 3.6 Automation (n8n)
- Self-hosted n8n container, free, no license cost for personal use.
- Workflow 1: Daily Job Search — polls an enabled `JobSource`, filters by user's saved
  criteria, calls backend `/match` endpoint, sends a notification (email/Telegram —
  user's choice, both free).
- Workflow 2: Application Assistant — given a job description, calls backend endpoints
  to produce tailored resume + cover letter + checklist, and emails the output.

## 4. Security

- Passwords hashed with bcrypt (via `passlib`).
- JWT access tokens (short-lived, 15 min) + refresh tokens (httpOnly cookie, 7 days).
- All input validated with Pydantic v2 models; file uploads restricted by type/size.
- Secrets only via `.env` (never committed — `.env.example` provided).
- Rate limiting on auth endpoints (slowapi) to prevent brute force.
- CORS locked to the frontend origin only.

## 5. Deployment (Local/Free)

`docker compose up -d` starts: `frontend`, `backend`, `postgres`, `redis`, `n8n`.
No cloud costs required. Optional: deploy free-tier on Render/Railway/Fly.io later —
out of scope for v1.

## 6. Known Limitations (stated up front, not discovered later)

- Live "search all job boards" scraping is **not** included — most boards prohibit it
  in their ToS and it breaks constantly. The Job Search Dashboard works off
  user-pasted job descriptions and/or one optional free-tier job API adapter.
- AI features require the user's own free-tier Gemini API key. Without a key, those
  endpoints return a clear "AI not configured" message rather than failing silently.
- GitHub Analyzer uses unauthenticated GitHub API by default (60 req/hr limit); adding
  a personal access token in `.env` raises this to 5,000 req/hr, still free.

## 7. Approval Checkpoint

This document, plus `database_design.md`, `api_design.md`, and `development_plan.md`,
define Phase 0. No application code will be written until you confirm these are
approved or request changes.
