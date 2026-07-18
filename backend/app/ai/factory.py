from app.core.config import settings
from app.ai.gemini import GeminiProvider
from app.ai.base import AIProvider

class AINotConfiguredError(Exception):
    """Custom exception raised when the AI provider is requested but not configured (key missing)."""
    pass

def get_ai_provider() -> AIProvider:
    if not settings.GEMINI_API_KEY:
        raise AINotConfiguredError("Gemini API key is not configured. Please set the GEMINI_API_KEY in your environment.")
    return GeminiProvider(settings.GEMINI_API_KEY)
