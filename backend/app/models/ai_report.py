from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
import uuid

class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    report_type = Column(String, nullable=False)  # 'job_match' | 'github_analysis' | 'resume_review' | 'career_advice'
    related_job_id = Column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    provider = Column(String, nullable=False, default="gemini")
    input_hash = Column(String, nullable=False, index=True)
    result_json = Column(JSONB, nullable=False)
    score = Column(Numeric, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship("User")
    related_job = relationship("Job")
