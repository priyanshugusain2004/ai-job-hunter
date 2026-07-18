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
from app.models.ai_report import AIReport
from app.core import security

# Mock AI Provider for Phase 5
class MockAIProviderPhase5(AIProvider):
    async def analyze_resume(self, resume_text: str):
        return {}
    async def analyze_job(self, job_text: str):
        return {}
    async def tailor_resume(self, resume_text: str, job_description: str):
        return {}
        
    async def generate_cover_letter(self, resume_text: str, job_text: str, tone: str):
        return {
            "cover_letter_text": f"Dear Hiring Manager,\n\nI am writing in a {tone} tone to apply.\n\nBest,\nCandidate"
        }
        
    async def match_resume_job(self, resume_text: str, job_text: str):
        # Return a high score if keywords match, or mock evaluation
        score = 80
        if "FastAPI" in resume_text and "FastAPI" in job_text:
            score = 95
        return {
            "score": score,
            "missing_skills": ["Kubernetes"] if "Kubernetes" not in resume_text else [],
            "suggestions": ["Add more cloud orchestration experience."]
        }
        
    async def analyze_github(self, repos_data: str):
        return {
            "repos_summary": "Active developer with python repositories.",
            "languages": {"Python": 90, "Shell": 10},
            "activity": "High",
            "strengths": ["Strong backend experience"],
            "weaknesses": ["No front-end framework repos"]
        }

    async def generate_interview_questions(self, resume_text: str, job_text: str):
        return {}

    async def get_career_advice(self, message: str, history: list):
        return {}


def get_auth_headers(client: TestClient, db: Session) -> dict:
    user = User(
        email="test_p5@example.com",
        password_hash=security.get_password_hash("password"),
        full_name="Phase 5 User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_p5@example.com", "password": "password"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def mock_ai():
    def override():
        return MockAIProviderPhase5()
    app.dependency_overrides[get_ai_provider_dep] = override
    yield
    app.dependency_overrides.clear()

def test_generate_cover_letter(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    
    user = db.query(User).filter(User.email == "test_p5@example.com").first()
    resume = Resume(user_id=user.id, kind="master", raw_text="Experienced Python FastAPI Dev", version=1)
    job = Job(user_id=user.id, title="Backend Engineer", company="FastAPI Corp", description_raw="Need a FastAPI developer.")
    
    db.add(resume)
    db.add(job)
    db.commit()
    db.refresh(resume)
    db.refresh(job)

    response = client.post(
        "/api/v1/cover-letters/generate",
        headers=headers,
        json={
            "resume_id": str(resume.id),
            "job_id": str(job.id),
            "tone": "enthusiastic"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "enthusiastic" in data["cover_letter_text"]

def test_match_resume_job_scoring(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    user = db.query(User).filter(User.email == "test_p5@example.com").first()
    
    # Setup sample 1: Good Match
    resume_good = Resume(user_id=user.id, kind="master", raw_text="FastAPI expert, Python backend programmer", version=1)
    job_good = Job(user_id=user.id, title="FastAPI Engineer", description_raw="We need a FastAPI expert.")
    
    # Setup sample 2: Poor Match
    resume_poor = Resume(user_id=user.id, kind="master", raw_text="Graphic Designer, Photoshop master", version=1)
    job_poor = Job(user_id=user.id, title="FastAPI Developer", description_raw="Need a FastAPI expert and Kubernetes orchestration.")
    
    db.add(resume_good)
    db.add(job_good)
    db.add(resume_poor)
    db.add(job_poor)
    db.commit()
    db.refresh(resume_good)
    db.refresh(job_good)
    db.refresh(resume_poor)
    db.refresh(job_poor)

    # Test Sample 1 Match (Good)
    res1 = client.post(
        "/api/v1/match/",
        headers=headers,
        json={"resume_id": str(resume_good.id), "job_id": str(job_good.id)}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["score"] == 95
    assert "Kubernetes" in data1["result_json"]["missing_skills"]

    # Test Sample 2 Match (Poor)
    res2 = client.post(
        "/api/v1/match/",
        headers=headers,
        json={"resume_id": str(resume_poor.id), "job_id": str(job_poor.id)}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["score"] == 80  # Default mock score

    # Check match history list
    hist_res = client.get("/api/v1/match/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2

def test_github_analyzer_integration(client: TestClient, db: Session, mock_ai):
    headers = get_auth_headers(client, db)
    
    # Analyze a real public username ("octocat") to verify real HTTP request handling
    response = client.post(
        "/api/v1/github/analyze",
        headers=headers,
        json={"username": "octocat"}
    )
    
    # Since octocat is a valid user, GitHub should either return 200 or 403/429 (rate limited).
    # Either way, our API should handle it cleanly.
    if response.status_code == 200:
        data = response.json()
        assert data["report_type"] == "github_analysis"
        assert "languages" in data["result_json"]
        assert "Python" in data["result_json"]["languages"]
        
        # Verify subsequent fetching via report_id
        report_id = data["id"]
        get_res = client.get(f"/api/v1/github/analyze/{report_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == report_id
    else:
        # If rate limited by GitHub in the test environment, status code must be 429
        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()
