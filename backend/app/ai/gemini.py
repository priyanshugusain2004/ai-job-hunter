import httpx
import json
from typing import Dict, Any
from app.ai.base import AIProvider
from app.ai.prompts import (
    RESUME_ANALYZE_INSTRUCTION,
    JOB_ANALYZE_INSTRUCTION,
    RESUME_TAILOR_INSTRUCTION,
    COVER_LETTER_INSTRUCTION,
    JOB_MATCH_INSTRUCTION,
    GITHUB_ANALYZE_INSTRUCTION,
    INTERVIEW_COACH_INSTRUCTION,
    CAREER_ADVICE_INSTRUCTION
)

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def _generate(self, prompt: str, system_instruction: str, response_json: bool = False) -> str:
        # Use gemini-1.5-flash for general fast text tasks with structured JSON support
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        
        contents = {
            "parts": [{"text": prompt}]
        }
        
        payload = {
            "contents": [contents],
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
            
        generation_config = {}
        if response_json:
            generation_config["responseMimeType"] = "application/json"
            
        if generation_config:
            payload["generationConfig"] = generation_config
            
        headers = {"Content-Type": "application/json"}
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
        if response.status_code != 200:
            raise Exception(f"Gemini API error (Status {response.status_code}): {response.text}")
            
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise Exception(f"Unexpected response structure from Gemini API: {data}")

    async def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        result_str = await self._generate(
            prompt=resume_text,
            system_instruction=RESUME_ANALYZE_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def analyze_job(self, job_text: str) -> Dict[str, Any]:
        result_str = await self._generate(
            prompt=job_text,
            system_instruction=JOB_ANALYZE_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def tailor_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        prompt = f"--- CANDIDATE RESUME ---\n{resume_text}\n\n--- TARGET JOB DESCRIPTION ---\n{job_description}"
        result_str = await self._generate(
            prompt=prompt,
            system_instruction=RESUME_TAILOR_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def generate_cover_letter(self, resume_text: str, job_text: str, tone: str) -> Dict[str, Any]:
        prompt = f"--- CANDIDATE RESUME ---\n{resume_text}\n\n--- TARGET JOB DESCRIPTION ---\n{job_text}\n\n--- REQUESTED TONE ---\n{tone}"
        result_str = await self._generate(
            prompt=prompt,
            system_instruction=COVER_LETTER_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def match_resume_job(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        prompt = f"--- CANDIDATE RESUME ---\n{resume_text}\n\n--- TARGET JOB DESCRIPTION ---\n{job_text}"
        result_str = await self._generate(
            prompt=prompt,
            system_instruction=JOB_MATCH_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def analyze_github(self, repos_data: str) -> Dict[str, Any]:
        prompt = f"--- GITHUB REPOSITORIES DATA ---\n{repos_data}"
        result_str = await self._generate(
            prompt=prompt,
            system_instruction=GITHUB_ANALYZE_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def generate_interview_questions(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        prompt = f"--- CANDIDATE RESUME ---\n{resume_text}\n\n--- TARGET JOB DESCRIPTION ---\n{job_text}"
        result_str = await self._generate(
            prompt=prompt,
            system_instruction=INTERVIEW_COACH_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)

    async def get_career_advice(self, message: str, history: list) -> Dict[str, Any]:
        chat_prompt = ""
        for msg in history:
            role = "Candidate" if msg.get("role") == "user" else "Advisor"
            chat_prompt += f"{role}: {msg.get('content')}\n"
        chat_prompt += f"Candidate: {message}\n"
        
        result_str = await self._generate(
            prompt=chat_prompt,
            system_instruction=CAREER_ADVICE_INSTRUCTION,
            response_json=True
        )
        return json.loads(result_str)


