from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
import uuid

class ResumeBase(BaseModel):
    kind: str = "master"
    source_job_id: Optional[uuid.UUID] = None
    file_path: Optional[str] = None
    raw_text: Optional[str] = None
    structured_json: Optional[Dict[str, Any]] = None
    version: int = 1

class ResumeCreate(ResumeBase):
    user_id: uuid.UUID

class ResumeUpdate(BaseModel):
    kind: Optional[str] = None
    source_job_id: Optional[uuid.UUID] = None
    file_path: Optional[str] = None
    raw_text: Optional[str] = None
    structured_json: Optional[Dict[str, Any]] = None
    version: Optional[int] = None

class ResumeOut(ResumeBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
