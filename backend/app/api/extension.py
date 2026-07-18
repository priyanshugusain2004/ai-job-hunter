from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobOut
from app.schemas.application import ApplicationOut
from app.api.deps import get_current_user

router = APIRouter()

class ExtensionSyncRequest(BaseModel):
    url: Optional[str] = None
    title: str
    company: str
    description: str
    status: Optional[str] = "wishlist"

class ExtensionSyncResponse(BaseModel):
    job: JobOut
    application: ApplicationOut

@router.post("/sync", response_model=ExtensionSyncResponse, status_code=status.HTTP_201_CREATED, tags=["Extension"])
def sync_job_from_extension(
    req_in: ExtensionSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Allowed status checklist
    allowed_statuses = ["wishlist", "applied", "interviewing", "offer", "rejected"]
    status_val = (req_in.status or "wishlist").lower()
    if status_val not in allowed_statuses:
        status_val = "wishlist"

    # Step 1: Find or Create Job
    job = None
    if req_in.url:
        job = db.query(Job).filter(
            Job.user_id == current_user.id,
            Job.external_url == req_in.url
        ).first()
        
    if not job:
        job = db.query(Job).filter(
            Job.user_id == current_user.id,
            Job.title == req_in.title,
            Job.company == req_in.company
        ).first()

    if not job:
        job = Job(
            user_id=current_user.id,
            title=req_in.title,
            company=req_in.company,
            description_raw=req_in.description,
            external_url=req_in.url,
            source="extension"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    # Step 2: Find or Create Application
    application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == job.id
    ).first()

    if not application:
        application = Application(
            user_id=current_user.id,
            job_id=job.id,
            status=status_val
        )
        db.add(application)
        db.commit()
        db.refresh(application)

    return ExtensionSyncResponse(job=job, application=application)

@router.get("/auth-check", tags=["Extension"])
def extension_auth_check(
    current_user: User = Depends(get_current_user)
):
    return {
        "authenticated": True,
        "email": current_user.email,
        "full_name": current_user.full_name
    }
