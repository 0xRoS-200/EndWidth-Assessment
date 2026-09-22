"""
API routes: POST /chat and GET /health.
"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agent.agent import chat, clear_session

router = APIRouter()


class ChatRequest(BaseModel):
    employee_id: str = Field(..., min_length=1, description="Employee ID, e.g. EMP001")
    message: str = Field(..., min_length=1, description="The employee's message")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Session ID for conversation history")


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    tools_used: list[str]
    session_id: str


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    if not req.employee_id.strip():
        raise HTTPException(status_code=422, detail="employee_id cannot be empty.")
    if not req.message.strip():
        raise HTTPException(status_code=422, detail="message cannot be empty.")

    try:
        result = chat(
            employee_id=req.employee_id.strip().upper(),
            message=req.message.strip(),
            session_id=req.session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        tools_used=result["tools_used"],
        session_id=req.session_id,
    )


@router.delete("/session/{session_id}")
def clear_session_endpoint(session_id: str):
    """Clear conversation history for a session."""
    clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}
