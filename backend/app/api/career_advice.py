from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.models.user import User
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider

router = APIRouter()

class ChatMessage(BaseModel):
    role: str # 'user' or 'model'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse, tags=["Career Advice"])
async def career_advice_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    try:
        # Convert request models to dictionary list for prompts handling
        history_list = []
        if req.history:
            history_list = [{"role": h.role, "content": h.content} for h in req.history]
            
        ai_res = await ai_provider.get_career_advice(
            message=req.message,
            history=history_list
        )
        
        response_text = ai_res.get("response", "")
        if not response_text:
            raise Exception("AI failed to return response text field.")
            
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Career advisor response failed: {str(e)}"
        )
