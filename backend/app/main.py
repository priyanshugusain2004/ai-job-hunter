from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.system import router as system_router
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.resumes import router as resumes_router
from app.api.jobs import router as jobs_router
from app.api.cover_letters import router as cover_letters_router
from app.api.github import router as github_router
from app.api.match import router as match_router
from app.api.applications import router as applications_router
from app.api.extension import router as extension_router
from app.api.career_advice import router as career_advice_router

app = FastAPI(
    title="AI Job Hunter API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(profile_router, prefix="/api/v1/profile")
app.include_router(resumes_router, prefix="/api/v1/resumes")
app.include_router(jobs_router, prefix="/api/v1/jobs")
app.include_router(cover_letters_router, prefix="/api/v1/cover-letters")
app.include_router(github_router, prefix="/api/v1/github")
app.include_router(match_router, prefix="/api/v1/match")
app.include_router(applications_router, prefix="/api/v1/applications")
app.include_router(extension_router, prefix="/api/v1/extension")
app.include_router(career_advice_router, prefix="/api/v1/career-advice")





# Also mount /health directly in root for ease of container checking
@app.get("/health", tags=["System"])
def root_health():
    return {"status": "ok"}
