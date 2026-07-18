from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.job import Job
from app.schemas.job import JobCreate, JobOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider


router = APIRouter()

@router.post("/", response_model=JobOut, status_code=status.HTTP_201_CREATED, tags=["Jobs"])
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_job = Job(
        user_id=current_user.id,
        title=job_in.title,
        company=job_in.company,
        location=job_in.location,
        description_raw=job_in.description_raw,
        external_url=job_in.external_url,
        source="manual"
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/", response_model=List[JobOut], tags=["Jobs"])
def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    return jobs

@router.get("/{job_id}", response_model=JobOut, tags=["Jobs"])
def get_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return job

@router.post("/{job_id}/analyze", response_model=JobOut, tags=["Jobs"])
async def analyze_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    try:
        parsed_result = await ai_provider.analyze_job(job.description_raw)
        
        # Populate basic fields from AI analysis if they were empty
        if not job.title and "title" in parsed_result:
            job.title = parsed_result["title"]
        if (not job.company or job.company == "Unknown") and "company" in parsed_result:
            job.company = parsed_result["company"]
            
        job.description_parsed = parsed_result
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

