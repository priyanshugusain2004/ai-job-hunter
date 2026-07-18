from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
import uuid

class ResumeSkill(Base):
    __tablename__ = "resume_skills"
    
    resume_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        primary_key=True
    )
    skill_id = Column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True
    )
    proficiency = Column(String, nullable=True)  # 'beginner' | 'intermediate' | 'advanced'

    # Relationships
    resume = relationship("Resume", back_populates="resume_skills_association")
    skill = relationship("Skill", back_populates="resume_skills_association")

class Resume(Base):
    __tablename__ = "resumes"

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
    kind = Column(String, nullable=False, default="master")  # 'master' | 'tailored'
    source_job_id = Column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    file_path = Column(String, nullable=True)
    raw_text = Column(String, nullable=True)
    structured_json = Column(JSONB, nullable=True)
    version = Column(Integer, nullable=False, default=1)

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
    user = relationship("User", back_populates="resumes")
    source_job = relationship("Job")
    resume_skills_association = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")
