from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
import uuid

class CoverLetterRequest(BaseModel):
    resume_id: uuid.UUID
    job_id: uuid.UUID
    tone: Optional[str] = "professional"

class CoverLetterOut(BaseModel):
    cover_letter_text: str

class GitHubRequest(BaseModel):
    username: str

class MatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_id: uuid.UUID

class AIReportOut(BaseModel):
    id: uuid.UUID
    report_type: str
    related_job_id: Optional[uuid.UUID] = None
    input_hash: str
    result_json: Dict[str, Any]
    score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
