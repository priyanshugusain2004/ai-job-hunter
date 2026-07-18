from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider
from app.models.resume import Resume


router = APIRouter()

@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED, tags=["Applications"])
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify that the application status is one of the allowed values
    allowed_statuses = ["wishlist", "applied", "interviewing", "offer", "rejected"]
    status_val = (app_in.status or "wishlist").lower()
    if status_val not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of {allowed_statuses}"
        )

    # Check duplicate application for the same job (optional safety check)
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == app_in.job_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application for this job already exists"
        )

    db_app = Application(
        user_id=current_user.id,
        job_id=app_in.job_id,
        resume_id=app_in.resume_id,
        status=status_val,
        applied_at=app_in.applied_at,
        notes=app_in.notes
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/", response_model=List[ApplicationOut], tags=["Applications"])
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    return apps

@router.get("/analytics", tags=["Applications"])
def get_applications_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    
    total = len(apps)
    counts = {
        "wishlist": 0,
        "applied": 0,
        "interviewing": 0,
        "offer": 0,
        "rejected": 0
    }
    for a in apps:
        status_key = a.status.lower()
        if status_key in counts:
            counts[status_key] += 1
            
    # Funnel conversions
    non_wishlist = counts["applied"] + counts["interviewing"] + counts["offer"] + counts["rejected"]
    interviewed = counts["interviewing"] + counts["offer"] + counts["rejected"]
    offers = counts["offer"]
    
    interview_rate = round((interviewed / non_wishlist) * 100, 1) if non_wishlist > 0 else 0.0
    offer_rate = round((offers / non_wishlist) * 100, 1) if non_wishlist > 0 else 0.0
    
    return {
        "total_applications": total,
        "status_counts": counts,
        "conversion_rates": {
            "interview_rate": interview_rate,
            "offer_rate": offer_rate
        }
    }

@router.get("/{app_id}", response_model=ApplicationOut, tags=["Applications"])
def get_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not db_app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return db_app

@router.put("/{app_id}", response_model=ApplicationOut, tags=["Applications"])
def update_application(
    app_id: uuid.UUID,
    app_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not db_app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    if app_in.status is not None:
        allowed_statuses = ["wishlist", "applied", "interviewing", "offer", "rejected"]
        status_val = app_in.status.lower()
        if status_val not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status must be one of {allowed_statuses}"
            )
        db_app.status = status_val

    if app_in.applied_at is not None:
        db_app.applied_at = app_in.applied_at
    if app_in.notes is not None:
        db_app.notes = app_in.notes
    if app_in.resume_id is not None:
        db_app.resume_id = app_in.resume_id

    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.delete("/{app_id}", tags=["Applications"])
def delete_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not db_app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    db.delete(db_app)
    db.commit()
    return {"message": "Application deleted successfully"}

@router.post("/{app_id}/interview-questions", tags=["Applications"])
async def generate_interview_questions_for_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    db_app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not db_app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
        
    resume = None
    if db_app.resume_id:
        resume = db.query(Resume).filter(Resume.id == db_app.resume_id, Resume.user_id == current_user.id).first()
    else:
        resume = db.query(Resume).filter(Resume.kind == "master", Resume.user_id == current_user.id).first()
        
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a master resume first to generate tailored interview questions."
        )
        
    try:
        res = await ai_provider.generate_interview_questions(
            resume_text=resume.raw_text or "",
            job_text=db_app.job.description_raw
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Interview questions generation failed: {str(e)}"
        )

