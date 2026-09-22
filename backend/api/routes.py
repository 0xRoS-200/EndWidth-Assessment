"""
API routes: POST /chat, POST /chat/stream, GET /health, DELETE /session/{id}.
"""
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent.agent import chat, chat_stream, clear_session
from logger import get_logger

log = get_logger("api.routes")
router = APIRouter()


class ChatRequest(BaseModel):
    employee_id: str = Field(..., min_length=1, description="Employee ID, e.g. EMP001")
    message: str = Field(..., min_length=1, description="The employee's message")
    session_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Session ID for conversation history",
    )


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
    """Standard (non-streaming) chat endpoint."""
    emp_id = req.employee_id.strip().upper()
    msg = req.message.strip()

    if not emp_id:
        raise HTTPException(status_code=422, detail="employee_id cannot be empty.")
    if not msg:
        raise HTTPException(status_code=422, detail="message cannot be empty.")

    log.info("POST /chat | emp=%s | session=%s | msg=%r", emp_id, req.session_id[:8], msg[:80])

    try:
        result = chat(employee_id=emp_id, message=msg, session_id=req.session_id)
    except Exception as e:
        log.error("POST /chat error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    log.info(
        "POST /chat | done | tools=%s | sources=%s",
        result["tools_used"], result["sources"],
    )
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        tools_used=result["tools_used"],
        session_id=req.session_id,
    )


@router.post("/chat/stream")
def chat_stream_endpoint(req: ChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).

    The response is a text/event-stream with the following event types:
      {"type": "tool_start", "tool": <name>}    — a tool has started executing
      {"type": "tool_end",   "tool": <name>}    — tool execution completed
      {"type": "token",      "text": <str>}     — one word/chunk of the final answer
      {"type": "done", "sources": [...], "tools_used": [...]}  — stream complete

    The agentic tool-call loop runs in real-time (each tool_start/tool_end event
    fires as the tool executes). The final answer is streamed word-by-word.
    """
    emp_id = req.employee_id.strip().upper()
    msg = req.message.strip()

    if not emp_id:
        raise HTTPException(status_code=422, detail="employee_id cannot be empty.")
    if not msg:
        raise HTTPException(status_code=422, detail="message cannot be empty.")

    log.info(
        "POST /chat/stream | emp=%s | session=%s | msg=%r",
        emp_id, req.session_id[:8], msg[:80],
    )

    def generate():
        try:
            yield from chat_stream(
                employee_id=emp_id,
                message=msg,
                session_id=req.session_id,
            )
        except Exception as e:
            import json
            log.error("POST /chat/stream error: %s", str(e), exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",          # disable nginx buffering
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.delete("/session/{session_id}")
def clear_session_endpoint(session_id: str):
    """Clear conversation history for a session."""
    log.info("DELETE /session/%s", session_id[:8])
    clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}
