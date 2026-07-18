from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
from pathlib import Path

from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.resume import ResumeOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.core.extractor import extract_text
from app.ai.base import AIProvider
from pydantic import BaseModel


class TailorRequest(BaseModel):
    job_id: uuid.UUID


router = APIRouter()

UPLOAD_DIR = "/app/uploads"
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED, tags=["Resumes"])
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are allowed."
        )
        
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}"
        )
        
    # Extract text from resume
    try:
        raw_text = extract_text(content, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from file: {str(e)}"
        )
        
    # Create unique file path
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file on server: {str(e)}"
        )
        
    # Create Resume DB Record
    db_resume = Resume(
        user_id=current_user.id,
        kind="master",
        file_path=file_path,
        raw_text=raw_text,
        version=1
    )
    
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    
    return db_resume

@router.get("/", response_model=List[ResumeOut], tags=["Resumes"])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeOut, tags=["Resumes"])
def get_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    return resume

@router.delete("/{resume_id}", tags=["Resumes"])
def delete_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    # Delete from disk
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            # Log error but proceed to delete record from DB
            print(f"Error removing file {resume.file_path}: {e}")
            
    db.delete(resume)
    db.commit()
    return {"message": "Resume successfully deleted"}

@router.post("/{resume_id}/analyze", response_model=ResumeOut, tags=["Resumes"])
async def analyze_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    try:
        parsed_result = await ai_provider.analyze_resume(resume.raw_text)
        resume.structured_json = parsed_result
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

@router.post("/{resume_id}/tailor", response_model=ResumeOut, status_code=status.HTTP_201_CREATED, tags=["Resumes"])
async def tailor_resume(
    resume_id: uuid.UUID,
    req_body: TailorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    job = db.query(Job).filter(Job.id == req_body.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
        
    try:
        tailored_result = await ai_provider.tailor_resume(resume.raw_text, job.description_raw)
        
        # Create a new tailored resume record
        db_tailored_resume = Resume(
            user_id=current_user.id,
            kind="tailored",
            source_job_id=job.id,
            raw_text=tailored_result.get("tailored_text"),
            structured_json=tailored_result,  # stores the dict including changes_made and skills_added
            version=resume.version + 1
        )
        
        db.add(db_tailored_resume)
        db.commit()
        db.refresh(db_tailored_resume)
        return db_tailored_resume
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI tailoring failed: {str(e)}"
        )


