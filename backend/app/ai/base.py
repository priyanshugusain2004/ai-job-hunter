from abc import ABC, abstractmethod
from typing import Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """Extract skills, experience, and parse sections of a resume into structured JSON."""
        pass

    @abstractmethod
    async def analyze_job(self, job_text: str) -> Dict[str, Any]:
        """Extract structured requirements, keywords, seniority, and skills from a job posting."""
        pass

    @abstractmethod
    async def tailor_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Tailor the resume text to highlight relevant experience matching the job description."""
        pass
