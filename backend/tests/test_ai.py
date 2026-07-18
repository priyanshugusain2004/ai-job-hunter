import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_ai_provider_dep
from app.ai.base import AIProvider
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.core import security

# Mock AI Provider
class MockAIProvider(AIProvider):
    async def analyze_resume(self, resume_text: str):
        return {
            "summary": "Mock summary parsed",
            "skills": [{"name": "Python", "category": "language"}],
            "experience": [{"company": "Google", "role": "Engineer", "start_date": "2024", "end_date": "Present", "highlights": []}],
            "education": []
        }

    async def analyze_job(self, job_text: str):
        return {
            "title": "Staff Engineer",
            "company": "Alphabet",
            "seniority": "Senior",
            "required_skills": [{"name": "Go", "category": "language"}],
            "preferred_skills": [],
            "requirements_summary": ["Code all day"]
        }

    async def tailor_resume(self, resume_text: str, job_description: str):
        return {
            "tailored_text": "# Tailored Resume Output",
            "changes_made": ["Highlighted Go experience"],
            "skills_added": ["Go"]
        }

    async def generate_cover_letter(self, resume_text: str, job_text: str, tone: str):
        return {}

    async def match_resume_job(self, resume_text: str, job_text: str):
        return {}

    async def analyze_github(self, repos_data: str):
        return {}

    async def generate_interview_questions(self, resume_text: str, job_text: str):
        return {}

    async def get_career_advice(self, message: str, history: list):
        return {}



def get_auth_headers(client: TestClient, db: Session) -> dict:
    user = User(
        email="test_ai@example.com",
        password_hash=security.get_password_hash("password"),
        full_name="AI Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_ai@example.com", "password": "password"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def mock_ai():
    def override():
        return MockAIProvider()
    app.dependency_overrides[get_ai_provider_dep] = override
    yield
    app.dependency_overrides.clear()

def test_analyze_resume(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    
    # Pre-create resume
    user = db.query(User).filter(User.email == "test_ai@example.com").first()
    resume = Resume(
        user_id=user.id,
        kind="master",
        raw_text="My original resume text",
        version=1
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    response = client.post(f"/api/v1/resumes/{resume.id}/analyze", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["structured_json"] is not None
    assert data["structured_json"]["summary"] == "Mock summary parsed"
    assert data["structured_json"]["skills"][0]["name"] == "Python"

def test_analyze_job(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    
    # Pre-create job
    user = db.query(User).filter(User.email == "test_ai@example.com").first()
    job = Job(
        user_id=user.id,
        title="",  # Empty to test auto-population
        company="",
        description_raw="Need a strong developer."
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    response = client.post(f"/api/v1/jobs/{job.id}/analyze", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Staff Engineer"
    assert data["company"] == "Alphabet"
    assert data["description_parsed"] is not None
    assert data["description_parsed"]["seniority"] == "Senior"

def test_tailor_resume(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    
    # Pre-create resume & job
    user = db.query(User).filter(User.email == "test_ai@example.com").first()
    resume = Resume(
        user_id=user.id,
        kind="master",
        raw_text="Old resume text",
        version=1
    )
    job = Job(
        user_id=user.id,
        title="Staff Engineer",
        company="Alphabet",
        description_raw="Go developer"
    )
    db.add(resume)
    db.add(job)
    db.commit()
    db.refresh(resume)
    db.refresh(job)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/tailor",
        headers=headers,
        json={"job_id": str(job.id)}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "tailored"
    assert data["source_job_id"] == str(job.id)
    assert data["version"] == 2
    
    # Verify new DB entry created
    tailored_db = db.query(Resume).filter(Resume.id == data["id"]).first()
    assert tailored_db is not None
    assert tailored_db.raw_text == "# Tailored Resume Output"
    assert tailored_db.structured_json["skills_added"] == ["Go"]

def test_ai_not_configured_error(client: TestClient, db: Session):
    # Do NOT apply the mock_ai override, and make sure settings key is empty
    from app.core.config import settings
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = None
    
    headers = get_auth_headers(client, db)
    
    user = db.query(User).filter(User.email == "test_ai@example.com").first()
    resume = Resume(
        user_id=user.id,
        kind="master",
        raw_text="Old resume text",
        version=1
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    try:
        response = client.post(f"/api/v1/resumes/{resume.id}/analyze", headers=headers)
        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["error"]["code"] == "ai_not_configured"
    finally:
        # Restore settings
        settings.GEMINI_API_KEY = original_key
