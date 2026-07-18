from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid
from app.schemas.job import JobOut

class ApplicationBase(BaseModel):
    job_id: uuid.UUID
    resume_id: Optional[uuid.UUID] = None
    status: str = "wishlist"
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None

class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    resume_id: Optional[uuid.UUID] = None
    status: Optional[str] = "wishlist"
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None
    resume_id: Optional[uuid.UUID] = None

class ApplicationOut(ApplicationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    job: Optional[JobOut] = None

    model_config = ConfigDict(from_attributes=True)
