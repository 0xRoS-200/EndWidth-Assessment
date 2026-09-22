"""
API routes:
  POST /auth/login        — issue a JWT (public)
  POST /auth/me           — return current user info (protected)
  POST /chat              — standard chat (protected)
  POST /chat/stream       — SSE streaming chat (protected)
  GET  /health            — health check (public)
  DELETE /session/{id}    — clear history (protected)
"""
import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent.agent import chat, chat_stream, clear_session
from auth.auth import create_access_token, verify_password, get_current_employee_id
from tools.tools import _EMPLOYEES          # shared in-memory employee store
from logger import get_logger

log = get_logger("api.routes")
router = APIRouter()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    employee_id: str = Field(..., min_length=1, description="Employee ID, e.g. EMP001")
    password: str = Field(..., min_length=1, description="Employee password")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_id: str
    name: str
    department: str


class ChatRequest(BaseModel):
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


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    """
    Authenticate an employee and return a JWT Bearer token.

    The token encodes the employee_id as its 'sub' claim. All subsequent
    requests to protected endpoints must include the token in the
    'Authorization: Bearer <token>' header.
    """
    emp_id = req.employee_id.strip().upper()
    emp = _EMPLOYEES.get(emp_id)

    # Use the same error message for unknown ID and wrong password to avoid
    # leaking which employee IDs exist (user enumeration prevention).
    invalid_exc = HTTPException(
        status_code=401,
        detail="Invalid employee ID or password.",
    )

    if not emp:
        log.warning("Login failed — unknown employee: %s", emp_id)
        raise invalid_exc

    if not verify_password(req.password, emp.get("password_hash", "")):
        log.warning("Login failed — wrong password for: %s", emp_id)
        raise invalid_exc

    token = create_access_token(emp_id)
    log.info("Login success | employee: %s (%s)", emp_id, emp["name"])

    return LoginResponse(
        access_token=token,
        employee_id=emp_id,
        name=emp["name"],
        department=emp["department"],
    )


# ---------------------------------------------------------------------------
# Protected routes (require valid JWT)
# ---------------------------------------------------------------------------

@router.get("/auth/me")
def get_me(employee_id: str = Depends(get_current_employee_id)):
    """Return the currently authenticated employee's profile."""
    emp = _EMPLOYEES.get(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return {
        "employee_id": employee_id,
        "name": emp["name"],
        "department": emp["department"],
        "role": emp["role"],
        "leave_balance": emp["leave_balance"],
    }


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    req: ChatRequest,
    employee_id: str = Depends(get_current_employee_id),
):
    """
    Standard (non-streaming) chat endpoint.

    The employee_id is extracted from the verified JWT token — it is NOT
    taken from the request body, which prevents any client-side impersonation.
    """
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=422, detail="message cannot be empty.")

    log.info("POST /chat | emp=%s | session=%s | msg=%r", employee_id, req.session_id[:8], msg[:80])

    try:
        result = chat(employee_id=employee_id, message=msg, session_id=req.session_id)
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
def chat_stream_endpoint(
    req: ChatRequest,
    employee_id: str = Depends(get_current_employee_id),
):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    Protected by JWT — employee_id is extracted from the token.

    Event types emitted:
      {"type": "tool_start", "tool": <name>}
      {"type": "tool_end",   "tool": <name>}
      {"type": "token",      "text": <str>}
      {"type": "done", "sources": [...], "tools_used": [...]}
      {"type": "error", "message": <str>}
    """
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=422, detail="message cannot be empty.")

    log.info(
        "POST /chat/stream | emp=%s | session=%s | msg=%r",
        employee_id, req.session_id[:8], msg[:80],
    )

    def generate():
        try:
            yield from chat_stream(
                employee_id=employee_id,
                message=msg,
                session_id=req.session_id,
            )
        except Exception as e:
            log.error("POST /chat/stream error: %s", str(e), exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.delete("/session/{session_id}")
def clear_session_endpoint(
    session_id: str,
    employee_id: str = Depends(get_current_employee_id),
):
    """Clear conversation history for a session (authenticated)."""
    log.info("DELETE /session/%s | emp=%s", session_id[:8], employee_id)
    clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}
