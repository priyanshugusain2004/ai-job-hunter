# AI Job Hunter

A self-hosted, privacy-first, and free-to-run automation tool to supercharge your job search. Track applications, analyze resumes, tailor cover letters, map out skills, and coach your interviews using AI.

---

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4
- **Backend**: FastAPI (Python), SQLAlchemy, Alembic (Migrations), Pytest
- **Database**: PostgreSQL (Data persistence)
- **Caching & Queue**: Redis
- **Containerization**: Docker & Docker Compose

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Setup & Run

1. Clone this repository (if you haven't already).
2. Start the services using Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Once running, you can access:
   - **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8001/health](http://localhost:8001/health)
   - **Interactive API Documentation (Swagger)**: [http://localhost:8001/api/v1/docs](http://localhost:8001/api/v1/docs)

---

## 🧪 Testing

To run the backend test suite, run the following command:
```bash
docker compose exec backend python -m pytest
```

---

## 📅 Development Roadmap

We are following a strict phase-by-phase development plan (see [docs/development_plan.md](docs/development_plan.md)):

- [x] **Phase 1 — Foundations**: Scaffold backend/frontend, Docker Compose, Alembic configuration, `/health` endpoint, React + Tailwind v4 integration.
- [ ] **Phase 2 — Auth & Profile**: User authentication, JWT, profiles, protected routes.
- [ ] **Phase 3 — Resume System**: Upload, text extraction, resume parsing.
- [ ] **Phase 4 — AI Layer & Resume Tailoring**: Gemini API integration, resume gap analysis, tailoring engine.
- [ ] **Phase 5 — Cover Letters & GitHub Analyzer**: cover letter generation, public repo analysis.
- [ ] **Phase 6 — Kanban Application Tracker & Interview Coach**: Application states, mock Q&A generation.
- [ ] **Phase 7 — Automation (n8n)**: n8n workflow scheduler for daily matching.
- [ ] **Phase 8 — Hardening & Security**: Rate-limiting, validation, production locking.
