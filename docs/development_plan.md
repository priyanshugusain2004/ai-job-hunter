# AI Job Hunter — Development Plan

Work proceeds in phases. Each phase ends with: explanation of what was built, tests run,
errors checked, and a stop for your confirmation before continuing.

## Phase 0 — Architecture (this phase)
- `architecture.md`, `database_design.md`, `api_design.md`, `development_plan.md`
- No code yet.
- **Waiting on your approval / change requests before Phase 1.**

## Phase 1 — Foundations
- Repo scaffold (`backend/`, `frontend/`, `docker/`, `docs/`, `scripts/`, `tests/`)
- Docker Compose: postgres, redis, backend, frontend (n8n added in Phase 6)
- FastAPI app skeleton + `/health` endpoint
- Alembic wired up, first migration (empty)
- React + Vite + TS + Tailwind skeleton, one placeholder page
- **Test gate:** `docker compose up -d` succeeds, `/health` returns 200, frontend loads.

## Phase 2 — Auth & Profile
- users table/model, register/login/refresh/logout, JWT, bcrypt hashing
- Frontend: Login, Register pages, auth context, protected routes
- **Test gate:** pytest auth tests (register, login, bad password, token refresh);
  manual login flow works in browser.

## Phase 3 — Resume System (no AI yet)
- Upload endpoint, PDF/DOCX text extraction (pypdf/python-docx), storage
- resumes/skills/skills-join models + migration
- Frontend: Resume Upload page, Profile page
- **Test gate:** upload a sample PDF and DOCX, confirm text extracted and stored.

## Phase 4 — AI Layer + Resume Analyzer + Tailoring
- `ai/` module: `AIProvider` interface, `GeminiProvider`, factory, prompt templates
- `/resumes/{id}/analyze`, `/jobs`, `/jobs/{id}/analyze`, `/resumes/{id}/tailor`
- Graceful "AI not configured" path if no key set
- Frontend: Resume Analyzer, Job Matcher input, Resume Generator pages
- **Test gate:** unit tests mock the AIProvider (no real API calls in CI); one manual
  end-to-end run with a real Gemini key to confirm output quality.

## Phase 5 — Cover Letters, GitHub Analyzer, Job Matching
- `/cover-letters/generate`, `/github/analyze`, `/match`
- Redis caching for GitHub + AI responses (input-hash keyed)
- Frontend: Cover Letter Generator, GitHub Analyzer, Match results pages
- **Test gate:** GitHub analyzer tested against a real public username; rate-limit
  handling verified; match scoring sanity-checked on 2–3 sample job/resume pairs.

## Phase 6 — Application Tracker + Interview Coach + Career Advisor
- applications, interview_questions, ai_reports tables
- Full CRUD tracker UI (kanban-style: saved/applied/interviewing/offer/rejected)
- Interview question generation + suggested answers
- Career advisor free-form Q&A
- **Test gate:** CRUD tests for applications; interview generation smoke test.

## Phase 7 — Automation (n8n)
- n8n container added to compose
- Workflow 1: Daily Job Search (JobSource adapter → filter → match → notify)
- Workflow 2: Application Assistant (job description in → resume+letter+checklist out)
- **Test gate:** both workflows run manually in n8n UI against the backend API.

## Phase 8 — Hardening & Docs
- Rate limiting, input validation review, CORS lockdown, security pass
- Full README, installation guide, API docs (OpenAPI auto-docs verified), dev guide
- Docker healthchecks on all services
- **Test gate:** fresh-clone `docker compose up -d` works with only `.env` filled in;
  full backend test suite green; no secrets committed.

## Explicitly Deferred / Out of Scope for v1
- Live multi-board job scraping (ToS and reliability issues — see architecture.md §6)
- Payments/billing (not needed for a personal free tool)
- Multi-tenant/team features
- Mobile app

## What I need from you before Phase 1 starts
1. Confirm Gemini as the only wired-up AI provider for now (OpenAI/local stay as stubs).
2. Confirm the "no live scraping" approach for Job Search Dashboard (manual paste +
   optional free-tier API adapter) — or tell me which specific free job API you want
   wired in.
3. Any changes to the schema/API/architecture above.

Once confirmed, Phase 1 starts.
