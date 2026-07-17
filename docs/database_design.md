# AI Job Hunter — Database Design (PostgreSQL)

All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and
`created_at` / `updated_at TIMESTAMPTZ DEFAULT now()` unless noted.

## users
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| email | TEXT | unique, not null |
| password_hash | TEXT | not null |
| full_name | TEXT | |
| location | TEXT | |
| phone | TEXT | |
| linkedin_url | TEXT | |
| github_username | TEXT | |
| portfolio_url | TEXT | |
| target_role | TEXT | e.g. "Backend Engineer" |
| is_active | BOOLEAN | default true |

## resumes
Master resume + per-job tailored versions live in the same table, distinguished by `kind`.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| kind | TEXT | 'master' \| 'tailored' |
| source_job_id | UUID | FK → jobs.id, nullable (set when kind='tailored') |
| file_path | TEXT | stored file location, nullable if AI-generated only |
| raw_text | TEXT | extracted text |
| structured_json | JSONB | parsed sections: summary, experience[], education[], etc. |
| version | INT | increments per tailoring pass |

## skills
Normalized skill list, many-to-many with resumes and users.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| name | TEXT | unique, not null |
| category | TEXT | e.g. 'language', 'framework', 'tool', 'soft-skill' |

## resume_skills (join table)
| column | type | notes |
|---|---|---|
| resume_id | UUID | FK → resumes.id |
| skill_id | UUID | FK → skills.id |
| proficiency | TEXT | nullable, e.g. 'beginner'/'intermediate'/'advanced' |

## projects
From resume and/or GitHub analysis.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| source | TEXT | 'manual' \| 'github' \| 'resume' |
| name | TEXT | |
| description | TEXT | |
| repo_url | TEXT | nullable |
| languages | JSONB | e.g. {"Python": 62.3, "TS": 37.7} |
| stars | INT | nullable |
| last_activity_at | TIMESTAMPTZ | nullable |

## jobs
Job postings, whether pasted manually or pulled from an optional JobSource adapter.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, nullable (null = shared/global posting) |
| title | TEXT | |
| company | TEXT | |
| location | TEXT | |
| description_raw | TEXT | not null |
| description_parsed | JSONB | extracted requirements, skills, seniority |
| source | TEXT | 'manual' \| 'api:<provider>' |
| external_url | TEXT | nullable |
| posted_at | TIMESTAMPTZ | nullable |

## applications
Tracks the user's application to a specific job.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| job_id | UUID | FK → jobs.id |
| resume_id | UUID | FK → resumes.id, nullable |
| cover_letter_text | TEXT | nullable |
| status | TEXT | 'saved' \| 'applied' \| 'interviewing' \| 'offer' \| 'rejected' \| 'withdrawn' |
| applied_at | TIMESTAMPTZ | nullable |
| notes | TEXT | nullable |

## interview_questions
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| application_id | UUID | FK → applications.id, nullable |
| user_id | UUID | FK → users.id |
| category | TEXT | 'technical' \| 'hr' \| 'project' \| 'behavioral' |
| question | TEXT | not null |
| suggested_answer | TEXT | nullable, AI-generated |

## ai_reports
Generic table for storing AI outputs (match scores, GitHub analysis, career advice) so
every AI call is auditable and re-viewable without re-calling the provider.
| column | type | notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| report_type | TEXT | 'job_match' \| 'github_analysis' \| 'resume_review' \| 'career_advice' |
| related_job_id | UUID | FK → jobs.id, nullable |
| provider | TEXT | which AIProvider generated it |
| input_hash | TEXT | for cache/dedup |
| result_json | JSONB | structured output |
| score | NUMERIC | nullable, used for job_match (0–100) |

## Indexes (initial set)
- `users(email)` unique
- `resumes(user_id, kind)`
- `jobs(user_id)`
- `applications(user_id, status)`
- `ai_reports(user_id, report_type)`
- `ai_reports(input_hash)` — cache lookups

## Migration Strategy
Alembic from the first commit. Every model change ships with a generated migration —
no manual schema drift.
