"""
API integration tests using FastAPI TestClient (no real network calls).
The agent.chat function is mocked so tests run without a Gemini API key.
"""
import os
import sys
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)

MOCK_CHAT_RESULT = {
    "answer": "Employees can work from home up to 2 days per week.",
    "sources": ["work_from_home_policy.txt"],
    "tools_used": ["search_company_documents"],
}


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /chat
# ---------------------------------------------------------------------------

class TestChatEndpoint:
    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_chat_returns_200(self, mock_chat):
        response = client.post(
            "/chat",
            json={"employee_id": "EMP001", "message": "What is the WFH policy?"},
        )
        assert response.status_code == 200

    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_chat_response_has_required_fields(self, mock_chat):
        response = client.post(
            "/chat",
            json={"employee_id": "EMP001", "message": "What is the WFH policy?"},
        )
        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert "tools_used" in data
        assert "session_id" in data

    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_chat_normalises_employee_id_to_uppercase(self, mock_chat):
        client.post(
            "/chat",
            json={"employee_id": "emp001", "message": "hello"},
        )
        # Verify the agent was called with uppercased ID
        mock_chat.assert_called_once()
        assert mock_chat.call_args.kwargs["employee_id"] == "EMP001"

    def test_chat_rejects_empty_employee_id(self):
        response = client.post(
            "/chat",
            json={"employee_id": "", "message": "Hello"},
        )
        assert response.status_code == 422

    def test_chat_rejects_empty_message(self):
        response = client.post(
            "/chat",
            json={"employee_id": "EMP001", "message": ""},
        )
        assert response.status_code == 422

    def test_chat_rejects_missing_employee_id(self):
        response = client.post("/chat", json={"message": "Hello"})
        assert response.status_code == 422

    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_session_id_echoed_in_response(self, mock_chat):
        my_session = "test-session-abc123"
        response = client.post(
            "/chat",
            json={
                "employee_id": "EMP001",
                "message": "Hello",
                "session_id": my_session,
            },
        )
        assert response.json()["session_id"] == my_session

    @patch("api.routes.chat", side_effect=RuntimeError("Gemini unavailable"))
    def test_chat_returns_500_on_agent_error(self, mock_chat):
        response = client.post(
            "/chat",
            json={"employee_id": "EMP001", "message": "What is the WFH policy?"},
        )
        assert response.status_code == 500
        assert "Agent error" in response.json()["detail"]


# ---------------------------------------------------------------------------
# DELETE /session/{session_id}
# ---------------------------------------------------------------------------

class TestClearSession:
    @patch("api.routes.clear_session")
    def test_clear_session_returns_200(self, mock_clear):
        response = client.delete("/session/my-session-id")
        assert response.status_code == 200

    @patch("api.routes.clear_session")
    def test_clear_session_returns_correct_body(self, mock_clear):
        response = client.delete("/session/my-session-id")
        data = response.json()
        assert data["status"] == "cleared"
        assert data["session_id"] == "my-session-id"
