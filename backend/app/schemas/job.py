from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
import uuid

class JobBase(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description_raw: str
    description_parsed: Optional[Dict[str, Any]] = None
    source: Optional[str] = "manual"
    external_url: Optional[str] = None
    posted_at: Optional[datetime] = None

class JobCreate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description_raw: str
    external_url: Optional[str] = None

class JobOut(JobBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
