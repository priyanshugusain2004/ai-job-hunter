from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
import redis
from typing import Dict, Any

from app.database.session import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # Check Database
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    # Check Redis
    redis_status = "healthy"
    try:
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, socket_timeout=2.0)
        r.ping()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
        
    # Check AI configuration (Gemini key)
    ai_status = "configured" if settings.GEMINI_API_KEY else "not_configured"
    
    # Determine overall status
    is_healthy = db_status == "healthy" and redis_status == "healthy"
    
    response = {
        "status": "healthy" if is_healthy else "unhealthy",
        "database": db_status,
        "redis": redis_status,
        "ai_provider": {
            "gemini": ai_status
        }
    }
    
    return response
