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
from auth.auth import create_access_token

client = TestClient(app)

MOCK_CHAT_RESULT = {
    "answer": "Employees can work from home up to 2 days per week.",
    "sources": ["work_from_home_policy.txt"],
    "tools_used": ["search_company_documents"],
}


def get_auth_headers(employee_id: str = "EMP001") -> dict:
    """Helper to generate Authorization header with a valid JWT."""
    token = create_access_token(employee_id)
    return {"Authorization": f"Bearer {token}"}


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
# POST /auth/login
# ---------------------------------------------------------------------------

class TestLoginEndpoint:
    def test_login_success(self):
        response = client.post(
            "/auth/login",
            json={"employee_id": "EMP001", "password": "Rahul@123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["employee_id"] == "EMP001"
        assert data["name"] == "Rahul Sharma"
        assert data["department"] == "Engineering"

    def test_login_normalises_employee_id(self):
        response = client.post(
            "/auth/login",
            json={"employee_id": "emp001", "password": "Rahul@123"},
        )
        assert response.status_code == 200
        assert response.json()["employee_id"] == "EMP001"

    def test_login_wrong_password_returns_401(self):
        response = client.post(
            "/auth/login",
            json={"employee_id": "EMP001", "password": "WrongPassword"},
        )
        assert response.status_code == 401
        assert "Invalid employee ID or password" in response.json()["detail"]

    def test_login_unknown_employee_returns_401(self):
        response = client.post(
            "/auth/login",
            json={"employee_id": "EMP999", "password": "RandomPassword"},
        )
        assert response.status_code == 401
        assert "Invalid employee ID or password" in response.json()["detail"]

    def test_login_missing_fields_returns_422(self):
        response = client.post("/auth/login", json={"employee_id": "EMP001"})
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

class TestAuthMeEndpoint:
    def test_get_me_with_valid_token(self):
        headers = get_auth_headers("EMP001")
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == "EMP001"
        assert data["name"] == "Rahul Sharma"
        assert "leave_balance" in data

    def test_get_me_without_token_returns_403(self):
        response = client.get("/auth/me")
        assert response.status_code == 403

    def test_get_me_with_invalid_token_returns_401(self):
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.token.value"},
        )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /chat
# ---------------------------------------------------------------------------

class TestChatEndpoint:
    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_chat_returns_200_with_auth(self, mock_chat):
        headers = get_auth_headers("EMP001")
        response = client.post(
            "/chat",
            json={"message": "What is the WFH policy?"},
            headers=headers,
        )
        assert response.status_code == 200

    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_chat_response_has_required_fields(self, mock_chat):
        headers = get_auth_headers("EMP001")
        response = client.post(
            "/chat",
            json={"message": "What is the WFH policy?"},
            headers=headers,
        )
        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert "tools_used" in data
        assert "session_id" in data

    def test_chat_without_auth_returns_403(self):
        response = client.post(
            "/chat",
            json={"message": "What is the WFH policy?"},
        )
        assert response.status_code == 403

    def test_chat_rejects_empty_message(self):
        headers = get_auth_headers("EMP001")
        response = client.post(
            "/chat",
            json={"message": ""},
            headers=headers,
        )
        assert response.status_code == 422

    @patch("api.routes.chat", return_value=MOCK_CHAT_RESULT)
    def test_session_id_echoed_in_response(self, mock_chat):
        headers = get_auth_headers("EMP001")
        my_session = "test-session-abc123"
        response = client.post(
            "/chat",
            json={
                "message": "Hello",
                "session_id": my_session,
            },
            headers=headers,
        )
        assert response.json()["session_id"] == my_session

    @patch("api.routes.chat", side_effect=RuntimeError("Gemini unavailable"))
    def test_chat_returns_500_on_agent_error(self, mock_chat):
        headers = get_auth_headers("EMP001")
        response = client.post(
            "/chat",
            json={"message": "What is the WFH policy?"},
            headers=headers,
        )
        assert response.status_code == 500
        assert "Agent error" in response.json()["detail"]


# ---------------------------------------------------------------------------
# DELETE /session/{session_id}
# ---------------------------------------------------------------------------

class TestClearSession:
    @patch("api.routes.clear_session")
    def test_clear_session_returns_200_with_auth(self, mock_clear):
        headers = get_auth_headers("EMP001")
        response = client.delete("/session/my-session-id", headers=headers)
        assert response.status_code == 200

    @patch("api.routes.clear_session")
    def test_clear_session_returns_correct_body(self, mock_clear):
        headers = get_auth_headers("EMP001")
        response = client.delete("/session/my-session-id", headers=headers)
        data = response.json()
        assert data["status"] == "cleared"
        assert data["session_id"] == "my-session-id"

    def test_clear_session_without_auth_returns_403(self):
        response = client.delete("/session/my-session-id")
        assert response.status_code == 403
