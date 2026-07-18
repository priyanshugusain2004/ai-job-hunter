import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import docx

from app.models.user import User
from app.models.resume import Resume
from app.core import security

# Minimal valid PDF bytes
MINIMAL_PDF_BYTES = (
    b'%PDF-1.4\n'
    b'1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n'
    b'2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n'
    b'3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>> endobj\n'
    b'4 0 obj <</Length 44>> stream\n'
    b'BT /F1 12 Tf 72 712 Td (Hello World Resume) Tj ET\n'
    b'endstream\n'
    b'endobj\n'
    b'xref\n'
    b'0 5\n'
    b'0000000000 65535 f\n'
    b'0000000009 00000 n\n'
    b'0000000056 00000 n\n'
    b'0000000111 00000 n\n'
    b'0000000212 00000 n\n'
    b'trailer <</Size 5 /Root 1 0 R>>\n'
    b'startxref\n'
    b'307\n'
    b'%%EOF'
)

def get_auth_headers(client: TestClient, db: Session) -> dict:
    # Create test user
    user = User(
        email="test_resume@example.com",
        password_hash=security.get_password_hash("password"),
        full_name="Resume Owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_resume@example.com", "password": "password"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_upload_pdf_resume(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    file_payload = {"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")}
    response = client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files=file_payload
    )
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "master"
    assert "id" in data
    assert data["version"] == 1

    # Check database
    resume = db.query(Resume).filter(Resume.id == data["id"]).first()
    assert resume is not None
    assert "Hello World Resume" in resume.raw_text

def test_upload_docx_resume(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    # Generate docx bytes
    doc = docx.Document()
    doc.add_paragraph("This is my Docx Resume Text.")
    doc_io = io.BytesIO()
    doc.save(doc_io)
    docx_bytes = doc_io.getvalue()
    
    file_payload = {"file": ("resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files=file_payload
    )
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "master"
    
    resume = db.query(Resume).filter(Resume.id == data["id"]).first()
    assert resume is not None
    assert "This is my Docx Resume Text" in resume.raw_text

def test_upload_unsupported_format(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    file_payload = {"file": ("resume.txt", b"Plain text resume", "text/plain")}
    response = client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files=file_payload
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_list_resumes(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    # Upload one
    file_payload = {"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")}
    client.post("/api/v1/resumes/upload", headers=headers, files=file_payload)
    
    response = client.get("/api/v1/resumes", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

def test_get_resume_detail(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    # Upload one
    file_payload = {"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")}
    upload_res = client.post("/api/v1/resumes/upload", headers=headers, files=file_payload)
    resume_id = upload_res.json()["id"]
    
    response = client.get(f"/api/v1/resumes/{resume_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resume_id

def test_delete_resume(client: TestClient, db: Session):
    headers = get_auth_headers(client, db)
    
    # Upload one
    file_payload = {"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")}
    upload_res = client.post("/api/v1/resumes/upload", headers=headers, files=file_payload)
    resume_id = upload_res.json()["id"]
    
    # Verify file saved on disk
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    assert resume.file_path is not None
    import os
    assert os.path.exists(resume.file_path)

    # Delete
    del_res = client.delete(f"/api/v1/resumes/{resume_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json() == {"message": "Resume successfully deleted"}

    # Verify database entry removed
    assert db.query(Resume).filter(Resume.id == resume_id).first() is None
    
    # Verify file deleted from disk
    assert not os.path.exists(resume.file_path)
