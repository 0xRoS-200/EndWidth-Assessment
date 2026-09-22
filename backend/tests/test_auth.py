"""
Unit tests for the JWT authentication module (backend/auth/auth.py).
"""
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from auth.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_employee_id,
)
from config import JWT_SECRET, JWT_ALGORITHM


class TestPasswordHashing:
    def test_hash_password_produces_sha256_hex(self):
        digest = hash_password("Rahul@123")
        assert isinstance(digest, str)
        assert len(digest) == 64

    def test_verify_password_success(self):
        stored = hash_password("SecretPass123")
        assert verify_password("SecretPass123", stored) is True

    def test_verify_password_failure(self):
        stored = hash_password("SecretPass123")
        assert verify_password("WrongPass", stored) is False


class TestJwtTokens:
    def test_create_access_token_structure(self):
        token = create_access_token("EMP001")
        assert isinstance(token, str)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert payload["sub"] == "EMP001"
        assert "exp" in payload

    def test_get_current_employee_id_valid(self):
        token = create_access_token("EMP002")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        emp_id = get_current_employee_id(creds)
        assert emp_id == "EMP002"

    def test_get_current_employee_id_invalid_token(self):
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.here")
        with pytest.raises(HTTPException) as exc_info:
            get_current_employee_id(creds)
        assert exc_info.value.status_code == 401
        assert "Invalid or expired token" in exc_info.value.detail

    def test_get_current_employee_id_expired_token(self):
        # Create token already expired in the past
        past_time = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {"sub": "EMP001", "exp": past_time}
        expired_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
        with pytest.raises(HTTPException) as exc_info:
            get_current_employee_id(creds)
        assert exc_info.value.status_code == 401
