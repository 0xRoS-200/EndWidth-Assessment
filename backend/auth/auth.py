"""
JWT authentication helpers.

Flow:
  1. Employee POSTs to /auth/login with employee_id + password
  2. Backend verifies password hash and issues a signed JWT
  3. Frontend stores token in localStorage and sends it as Bearer token on every request
  4. Protected routes use the get_current_employee_id dependency to verify the token
     and extract the authenticated employee_id — this is used instead of the
     employee_id in the request body (prevents impersonation)

Security notes:
  - Passwords are SHA-256 hashed (demo-grade — use bcrypt in production)
  - JWT_SECRET must be changed from the default before any real deployment
  - Tokens expire after JWT_EXPIRE_HOURS (default 8 h)
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS
from logger import get_logger

log = get_logger("auth")

# HTTPBearer extracts the Authorization: Bearer <token> header automatically
_bearer = HTTPBearer(auto_error=True)


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    """Return the SHA-256 hex digest of a plain-text password."""
    return hashlib.sha256(plain.encode()).hexdigest()


def verify_password(plain: str, stored_hash: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    import hmac
    return hmac.compare_digest(hash_password(plain), stored_hash)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(employee_id: str) -> str:
    """Create a signed JWT for the given employee, expiring after JWT_EXPIRE_HOURS."""
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": employee_id, "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    log.info("Issued JWT for employee: %s (expires in %dh)", employee_id, JWT_EXPIRE_HOURS)
    return token


def get_current_employee_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    FastAPI dependency — validates the Bearer JWT and returns the employee_id (sub claim).
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        emp_id: Optional[str] = payload.get("sub")
        if not emp_id:
            raise HTTPException(status_code=401, detail="Token missing subject claim.")
        log.debug("Token verified | employee: %s", emp_id)
        return emp_id
    except JWTError as exc:
        log.warning("Token verification failed: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
