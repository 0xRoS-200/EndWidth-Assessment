# API Reference — Employee AI Assistant

Base URL: `http://localhost:8000`

Interactive docs (Swagger UI): [`http://localhost:8000/docs`](http://localhost:8000/docs)

---

## Authentication Overview

All chat and session endpoints are protected using **JWT Bearer Tokens**.
1. Log in via `POST /auth/login` with `employee_id` and `password`.
2. Receive a signed JWT access token (valid for 8 hours by default).
3. Include the token in the HTTP `Authorization` header for protected endpoints:
   ```http
   Authorization: Bearer <access_token>
   ```
4. The authenticated `employee_id` is extracted securely from the JWT subject claim (`sub`) on the backend, preventing client-side identity spoofing.

### Demo Employee Credentials

| Employee ID | Name | Department | Role | Default Password |
|---|---|---|---|---|
| `EMP001` | Rahul Sharma | Engineering | Software Engineer | `Rahul@123` |
| `EMP002` | Priya Nair | HR | HR Business Partner | `Priya@123` |
| `EMP003` | Arjun Mehta | Finance | Financial Analyst | `Arjun@123` |

---

## Endpoints

### 1. `POST /auth/login` (Public)

Authenticate an employee and obtain a JWT Bearer token.

#### Request Body
```json
{
  "employee_id": "EMP001",
  "password": "Rahul@123"
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "employee_id": "EMP001",
  "name": "Rahul Sharma",
  "department": "Engineering"
}
```

#### Error Responses
- `401 Unauthorized`: `"Invalid employee ID or password."`
- `422 Unprocessable Entity`: Missing fields

---

### 2. `GET /auth/me` (Protected)

Get the authenticated employee's full profile including real-time leave balance.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "employee_id": "EMP001",
  "name": "Rahul Sharma",
  "department": "Engineering",
  "role": "Software Engineer",
  "leave_balance": 12
}
```

#### Error Responses
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Missing Authorization header

---

### 3. `POST /chat` (Protected)

Standard (non-streaming) chat endpoint. The assistant autonomously selects tools (`search_company_documents`, `get_employee_info`, `apply_leave`) based on user intent.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | ✅ | The employee's question or instruction |
| `session_id` | `string` | ❌ | UUID for conversation history. Auto-generated if omitted. |

```json
{
  "message": "What is the work from home policy?",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### Response Body (200 OK)
```json
{
  "answer": "Employees are eligible for remote work up to 2 days per week after completing their 3-month probation period...",
  "sources": ["work_from_home_policy.txt"],
  "tools_used": ["search_company_documents"],
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### 4. `POST /chat/stream` (Protected)

Real-time streaming chat endpoint using **Server-Sent Events (SSE)**. Emits progress events as tools run and streams tokens word-by-word.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "message": "Check my leave balance and apply 2 days leave from 2026-10-10 to 2026-10-11 for personal reasons",
  "session_id": "session-123"
}
```

#### SSE Stream Events Emitted:
```
data: {"type": "tool_start", "tool": "get_employee_info"}

data: {"type": "tool_end", "tool": "get_employee_info"}

data: {"type": "tool_start", "tool": "apply_leave"}

data: {"type": "tool_end", "tool": "apply_leave"}

data: {"type": "token", "text": "Your "}

data: {"type": "token", "text": "leave "}

data: {"type": "token", "text": "has been applied..."}

data: {"type": "done", "sources": [], "tools_used": ["get_employee_info", "apply_leave"]}
```

---

### 5. `DELETE /session/{session_id}` (Protected)

Clears server-side conversation history for the specified session.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "status": "cleared",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### 6. `GET /health` (Public)

Service liveness and health check endpoint.

#### Response (200 OK)
```json
{
  "status": "ok"
}
```
