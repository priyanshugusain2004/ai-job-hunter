from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.ai_report import CoverLetterRequest, CoverLetterOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider
from app.core.cache import get_cache, set_cache

router = APIRouter()

@router.post("/generate", response_model=CoverLetterOut, status_code=status.HTTP_200_OK, tags=["Cover Letters"])
async def generate_cover_letter(
    req_body: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    # Fetch and verify resume
    resume = db.query(Resume).filter(Resume.id == req_body.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    # Fetch and verify job
    job = db.query(Job).filter(Job.id == req_body.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check cache
    cache_key = f"cover_letter:{resume.id}:{job.id}:{req_body.tone}"
    cached_val = get_cache(cache_key)
    if cached_val and isinstance(cached_val, dict) and "cover_letter_text" in cached_val:
        return CoverLetterOut(cover_letter_text=cached_val["cover_letter_text"])

    try:
        # Generate with AI
        ai_res = await ai_provider.generate_cover_letter(
            resume_text=resume.raw_text or "",
            job_text=job.description_raw,
            tone=req_body.tone or "professional"
        )
        
        cover_letter_text = ai_res.get("cover_letter_text", "")
        if not cover_letter_text:
            raise Exception("AI failed to return cover letter text field.")
            
        # Cache results for 24 hours
        set_cache(cache_key, {"cover_letter_text": cover_letter_text}, expire_seconds=86400)
        
        return CoverLetterOut(cover_letter_text=cover_letter_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cover letter generation failed: {str(e)}"
        )
