from sqlalchemy import Column, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base
import uuid

class Skill(Base):
    __tablename__ = "skills"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True
    )
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=True)  # 'language', 'framework', 'tool', 'soft-skill'

    # Relationships
    resume_skills_association = relationship("ResumeSkill", back_populates="skill", cascade="all, delete-orphan")
