import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_ai_provider_dep
from app.ai.base import AIProvider
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.resume import Resume
from app.core import security


def get_auth_headers(client: TestClient, db: Session) -> dict:
    user = User(
        email="test_p6@example.com",
        password_hash=security.get_password_hash("password"),
        full_name="Phase 6 User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_p6@example.com", "password": "password"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_application_lifecycle(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    user = db.query(User).filter(User.email == "test_p6@example.com").first()
    
    # Create target job
    job = Job(user_id=user.id, title="QA Engineer", company="Test Inc", description_raw="QA engineering raw posting.")
    db.add(job)
    db.commit()
    db.refresh(job)

    # 1. Create application
    response = client.post(
        "/api/v1/applications/",
        headers=headers,
        json={
            "job_id": str(job.id),
            "status": "wishlist",
            "notes": "Interested in testing"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "wishlist"
    assert data["notes"] == "Interested in testing"
    app_id = data["id"]

    # 2. List applications
    list_res = client.get("/api/v1/applications/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Fetch details
    detail_res = client.get(f"/api/v1/applications/{app_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["job"]["company"] == "Test Inc"

    # 4. Update status
    update_res = client.put(
        f"/api/v1/applications/{app_id}",
        headers=headers,
        json={"status": "applied"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "applied"

    # 5. Check analytics
    analytics_res = client.get("/api/v1/applications/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["total_applications"] == 1
    assert analytics["status_counts"]["applied"] == 1
    assert analytics["status_counts"]["wishlist"] == 0

    # 6. Delete application
    del_res = client.delete(f"/api/v1/applications/{app_id}", headers=headers)
    assert del_res.status_code == 200

def test_chrome_extension_endpoints(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    # 1. Test Auth Check
    auth_res = client.get("/api/v1/extension/auth-check", headers=headers)
    assert auth_res.status_code == 200
    assert auth_res.json()["authenticated"] is True
    assert auth_res.json()["email"] == "test_p6@example.com"

    # 2. Test Sync Payload (creates job & application from scraper)
    sync_res = client.post(
        "/api/v1/extension/sync",
        headers=headers,
        json={
            "url": "https://linkedin.com/jobs/view/12345",
            "title": "React Developer",
            "company": "Vite Corp",
            "description": "We build fast things with React.",
            "status": "applied"
        }
    )
    assert sync_res.status_code == 201
    sync_data = sync_res.json()
    assert sync_data["job"]["title"] == "React Developer"
    assert sync_data["application"]["status"] == "applied"
    
    # Verify job created in DB
    user = db.query(User).filter(User.email == "test_p6@example.com").first()
    job_db = db.query(Job).filter(Job.user_id == user.id, Job.title == "React Developer").first()
    assert job_db is not None

class MockAIProviderPhase6(AIProvider):
    async def analyze_resume(self, resume_text: str): return {}
    async def analyze_job(self, job_text: str): return {}
    async def tailor_resume(self, resume_text: str, job_description: str): return {}
    async def generate_cover_letter(self, resume_text: str, job_text: str, tone: str): return {}
    async def match_resume_job(self, resume_text: str, job_text: str): return {}
    async def analyze_github(self, repos_data: str): return {}
    
    async def generate_interview_questions(self, resume_text: str, job_text: str):
        return {
            "questions": [
                {"question": "How do you use FastAPI?", "suggested_answer": "Use router annotations."}
            ]
        }
    async def get_career_advice(self, message: str, history: list):
        return {
            "response": "Keep learning coding."
        }

@pytest.fixture
def mock_ai_p6():
    def override():
        return MockAIProviderPhase6()
    app.dependency_overrides[get_ai_provider_dep] = override
    yield
    app.dependency_overrides.clear()

def test_generate_interview_questions(client: TestClient, db: Session, mock_ai_p6):
    headers = get_auth_headers(client, db)
    user = db.query(User).filter(User.email == "test_p6@example.com").first()
    
    resume = Resume(user_id=user.id, kind="master", raw_text="FastAPI Programmer", version=1)
    job = Job(user_id=user.id, title="Backend engineer", company="FastAPI LLC", description_raw="FastAPI work.")
    db.add(resume)
    db.add(job)
    db.commit()
    db.refresh(resume)
    db.refresh(job)
    
    app_record = Application(user_id=user.id, job_id=job.id, status="applied", resume_id=resume.id)
    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    
    response = client.post(
        f"/api/v1/applications/{app_record.id}/interview-questions",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert data["questions"][0]["question"] == "How do you use FastAPI?"

def test_career_advice_chat(client: TestClient, db: Session, mock_ai_p6):
    headers = get_auth_headers(client, db)
    
    response = client.post(
        "/api/v1/career-advice/chat",
        headers=headers,
        json={
            "message": "Should I negotiate salary?",
            "history": []
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Keep learning coding."

