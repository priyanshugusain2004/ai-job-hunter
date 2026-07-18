from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.ai_report import AIReport
from app.schemas.ai_report import MatchRequest, AIReportOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider
from app.core.cache import get_cache, set_cache, generate_input_hash

router = APIRouter()

@router.post("/", response_model=AIReportOut, tags=["Matching"])
async def match_resume_job(
    req_body: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    # Fetch resume
    resume = db.query(Resume).filter(Resume.id == req_body.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    # Fetch job
    job = db.query(Job).filter(Job.id == req_body.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    # Generate unique input hash for current versions
    input_text = f"r:{resume.id}:{resume.updated_at.isoformat()}|j:{job.id}:{job.updated_at.isoformat()}"
    input_hash = generate_input_hash(input_text)
    
    # Check DB
    existing_report = db.query(AIReport).filter(
        AIReport.user_id == current_user.id,
        AIReport.report_type == "job_match",
        AIReport.related_job_id == job.id,
        AIReport.input_hash == input_hash
    ).first()
    
    if existing_report:
        return existing_report
        
    # Check Redis cache
    cache_key = f"job_match:{resume.id}:{job.id}"
    cached_val = get_cache(cache_key)
    if cached_val and isinstance(cached_val, dict):
        db_report = AIReport(
            user_id=current_user.id,
            report_type="job_match",
            related_job_id=job.id,
            input_hash=input_hash,
            result_json=cached_val,
            score=cached_val.get("score")
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    try:
        # Run AI Job Match Scoring
        match_result = await ai_provider.match_resume_job(
            resume_text=resume.raw_text or "",
            job_text=job.description_raw
        )
        
        score = match_result.get("score", 0)
        
        # Save to DB
        db_report = AIReport(
            user_id=current_user.id,
            report_type="job_match",
            related_job_id=job.id,
            input_hash=input_hash,
            result_json=match_result,
            score=score
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Save in Redis Cache
        set_cache(cache_key, match_result, expire_seconds=86400)
        
        return db_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI matching score calculation failed: {str(e)}"
        )

@router.get("/history", response_model=List[AIReportOut], tags=["Matching"])
def list_match_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(AIReport).filter(
        AIReport.user_id == current_user.id,
        AIReport.report_type == "job_match"
    ).order_by(AIReport.created_at.desc()).all()
    return reports
