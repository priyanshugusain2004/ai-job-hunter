# AI Job Hunter — API Design

Base path: `/api/v1`. All responses JSON. Auth via `Authorization: Bearer <JWT>`
except `/auth/*`.

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /auth/register | email, password, full_name | creates user, returns tokens |
| POST | /auth/login | email, password | returns access + refresh (httpOnly cookie) |
| POST | /auth/refresh | (cookie) | rotates access token |
| POST | /auth/logout | — | clears refresh cookie |

## Profile
| Method | Path | Notes |
|---|---|---|
| GET | /profile/me | current user profile |
| PUT | /profile/me | update profile fields |

## Resumes
| Method | Path | Notes |
|---|---|---|
| POST | /resumes/upload | multipart PDF/DOCX → stores + extracts text |
| GET | /resumes | list user's resumes (master + tailored versions) |
| GET | /resumes/{id} | get one, includes structured_json |
| POST | /resumes/{id}/analyze | AI: skills/experience breakdown, gaps |
| DELETE | /resumes/{id} | |

## Jobs
| Method | Path | Notes |
|---|---|---|
| POST | /jobs | paste/create a job posting (title, company, description) |
| GET | /jobs | list saved jobs |
| GET | /jobs/{id} | job detail incl. parsed requirements |
| POST | /jobs/{id}/analyze | AI: extract structured requirements/keywords |

## Resume Tailoring
| Method | Path | Notes |
|---|---|---|
| POST | /resumes/{id}/tailor | body: job_id → returns new tailored resume (kind='tailored') |

## Cover Letters
| Method | Path | Notes |
|---|---|---|
| POST | /cover-letters/generate | body: resume_id, job_id, tone → returns text |

## GitHub Analyzer
| Method | Path | Notes |
|---|---|---|
| POST | /github/analyze | body: username → repos, languages, activity, AI strengths/weaknesses |
| GET | /github/analyze/{report_id} | fetch a cached prior report |

## Job Matching
| Method | Path | Notes |
|---|---|---|
| POST | /match | body: resume_id, job_id → score 0–100, missing_skills[], suggestions[] |
| GET | /match/history | past match reports |

## Application Tracker
| Method | Path | Notes |
|---|---|---|
| POST | /applications | create (job_id, resume_id, status) |
| GET | /applications | list, filterable by status |
| PUT | /applications/{id} | update status/notes |
| DELETE | /applications/{id} | |

## Interview Coach
| Method | Path | Notes |
|---|---|---|
| POST | /interview/generate | body: job_id or application_id, categories[] → questions + suggested answers |
| GET | /interview/{application_id} | list stored questions for an application |

## Career Advisor
| Method | Path | Notes |
|---|---|---|
| POST | /advisor/ask | body: question, context (resume_id/job_id optional) → AI answer |

## System
| Method | Path | Notes |
|---|---|---|
| GET | /health | liveness/readiness, checks DB + Redis + AI-key-present |

## Conventions
- Errors: `{ "error": { "code": "string", "message": "string" } }`, standard HTTP codes.
- Pagination: `?page=&page_size=` on all list endpoints, response includes `total`.
- AI endpoints: if no provider key configured, return `503` with
  `{"error": {"code": "ai_not_configured", ...}}` rather than a generic 500.
- All AI endpoints are rate-limited per user (configurable) to avoid burning free-tier
  quota accidentally.
