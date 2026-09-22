# Employee AI Assistant

A production-ready RAG + Agentic AI assistant built for the EndWidth Full Stack + Generative AI Assessment.

---

## Highlights & Features

- 🔍 **RAG Pipeline**: Custom JSON vector store (pure Python + NumPy cosine similarity) + **Hybrid Reranking** combining semantic embeddings and BM25-style keyword overlap.
- 🤖 **Agentic Function Calling**: Autonomous multi-step tool execution powered by Google Gemini (`search_company_documents`, `get_employee_info`, `apply_leave`).
- ⚡ **Real-Time Streaming**: Server-Sent Events (SSE) emitting live tool execution status and word-by-word streaming answers to the frontend.
- 🔐 **JWT Authentication**: Secure Bearer token authentication protecting all API endpoints (`/chat`, `/chat/stream`, `/session/{id}`, `/auth/me`). Impersonation-proof: employee identity is extracted strictly from the validated token.
- 🎨 **Modern Frontend**: React + Tailwind CSS (Vite) with dark mode glassmorphism UI, real-time tool badges, live streaming typography, and one-click demo credentials.
- 🐳 **Dockerized**: Full one-command Docker & Docker Compose setup for both backend and frontend.
- 🧪 **51 Automated Tests**: Complete pytest suite covering agent tools, vector retriever, hybrid reranker, JWT auth, and API routes.

---

## Architecture Overview

See [`docs/architecture.md`](docs/architecture.md) for detailed architectural diagrams.

```
┌────────────────────────────────────────────────────────┐
│             React + Tailwind CSS Frontend              │
│       (Login Portal • Chat Interface • SSE Stream)     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / Bearer JWT
┌──────────────────────────▼─────────────────────────────┐
│                 FastAPI Backend Server                 │
│  ┌───────────────────────┬───────────────────────────┐ │
│  │   Auth Module (JWT)   │    API Routes & Logger    │ │
│  └───────────────────────┴───────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │       Gemini Agent & Tool Orchestration Loop      │ │
│  └───────────┬───────────────────────────┬───────────┘ │
│              ▼                           ▼             │
│   ┌─────────────────────┐     ┌──────────────────────┐ │
│   │     Mock Tools      │     │     RAG Retriever    │ │
│   │ (Employee & Leave)  │     │ (Vector + Reranker)  │ │
│   └─────────────────────┘     └──────────┬───────────┘ │
└──────────────────────────────────────────┼─────────────┘
                                           ▼
                               ┌───────────────────────┐
                               │  JSON Vector Store    │
                               │  (Custom NumPy store) │
                               └───────────────────────┘
```

---

## Quick Start with Docker (Recommended)

Run the entire application (Backend + Frontend) in one command:

```bash
# 1. Clone repository
git clone <repo-url>
cd EndWidth-Assessment

# 2. Configure environment
cp .env.example .env
# Set your GEMINI_API_KEY in .env

# 3. Build & start containers
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env and insert GEMINI_API_KEY=your_key

# Run Ingestion (creates JSON vector store from policy docs)
cd backend
python -m ingestion.ingest

# Start Backend Server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Demo Credentials

The portal includes pre-configured employee accounts with one-click selection on the login page:

| Employee ID | Name | Department | Role | Password |
|---|---|---|---|---|
| `EMP001` | Rahul Sharma | Engineering | Software Engineer | `Rahul@123` |
| `EMP002` | Priya Nair | HR | HR Business Partner | `Priya@123` |
| `EMP003` | Arjun Mehta | Finance | Financial Analyst | `Arjun@123` |

---

## Test Suite

The test suite runs completely offline without needing an active API key (all Gemini network calls are mocked):

```bash
# Run all 51 tests
pytest backend/tests/ -v
```

### Test Coverage Breakdown:
- **`backend/tests/test_auth.py`** (7 tests): SHA-256 password hashing, constant-time verification, JWT signing, claim decoding, expiration handling, tampered token rejection.
- **`backend/tests/test_tools.py`** (13 tests): `get_employee_info` and `apply_leave` edge cases (insufficient balance, date validation, negative intervals, state mutation).
- **`backend/tests/test_retriever.py`** (12 tests): Keyword overlap scoring, hybrid reranking weights, similarity threshold filtering, and hallucination fallback.
- **`backend/tests/test_routes.py`** (19 tests): Public health checks, login validation, `/auth/me` profile responses, protected chat authorization, SSE streaming, and session clearing.

---

## Key Technical Decisions

### 1. Vector Database
- **Custom JSON Store**: Implemented with pure Python and NumPy cosine similarity. Persisted at `backend/vector_store_data/store.json`.
- **Zero Heavy External Dependencies**: Fast, deterministic, and self-contained for the assessment scope without requiring complex external services.

### 2. Hybrid Reranking
- Combines dense semantic vector similarity (`gemini-embedding-001`) with BM25-style lexical keyword overlap (`rerank_score = 0.7 * vector_sim + 0.3 * keyword_overlap`).
- Ensures exact terms (e.g. "maternity", "probation", "401k") receive high relevance ranks even if generic vector distances are close.

### 3. Identity and Security
- Protected endpoints require valid Bearer JWT.
- The agent and tool executor always bind the action to the authenticated `employee_id` in the token, preventing unauthorized operations.

---

## API Reference

See [`docs/api.md`](docs/api.md) for full endpoint specifications, request/response models, curl snippets, and SSE event formats.
