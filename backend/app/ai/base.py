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

    @abstractmethod
    async def generate_cover_letter(self, resume_text: str, job_text: str, tone: str) -> Dict[str, Any]:
        """Generate a cover letter matching the candidate's resume to the target job in a specific tone."""
        pass

    @abstractmethod
    async def match_resume_job(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        """Score and evaluate a candidate's resume fit against a job description requirements."""
        pass

    @abstractmethod
    async def analyze_github(self, repos_data: str) -> Dict[str, Any]:
        """Analyze public repos summaries to identify language distributions, activity levels, and strengths/weaknesses."""
        pass

    @abstractmethod
    async def generate_interview_questions(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        """Generate tailored technical and behavioral interview questions and suggested answers."""
        pass

    @abstractmethod
    async def get_career_advice(self, message: str, history: list) -> Dict[str, Any]:
        """Strategic interactive chat strategizing job hunting, career advice, and negotiations."""
        pass


