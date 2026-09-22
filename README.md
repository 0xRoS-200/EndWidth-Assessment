# Employee AI Assistant

A RAG + Agentic AI assistant built for the EndWidth Full Stack + Generative AI Assessment.

---

## Overview

The assistant answers employee questions about company policies using Retrieval-Augmented Generation (RAG) and can perform actions (check leave balance, apply leave) through an agentic tool-calling loop powered by Google Gemini.

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full diagram.

**Four layers:**
1. **Ingestion** — loads `.txt` policy files, chunks by heading, embeds with Gemini, stores in a custom JSON-backed vector store
2. **RAG** — embeds the query, retrieves top-k chunks by cosine similarity (NumPy), generates an answer using only the retrieved context
3. **Agent** — Gemini function-calling loop that decides which tool(s) to call and combines results
4. **App** — FastAPI backend (`/chat`) + React + Tailwind frontend

---

## Technologies Used

| Layer | Technology |
|---|---|
| Backend framework | FastAPI |
| Vector database | Custom JSON-backed store (NumPy cosine similarity) |
| LLM | Google Gemini `gemini-2.0-flash` |
| Embeddings | Google Gemini `models/gemini-embedding-001` |
| Agent framework | Plain Python (no LangChain) |
| Frontend | React + Tailwind CSS (Vite) |

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone and enter the repo
```bash
git clone <repo-url>
cd EndWidth-Assessment
```

### 2. Create a virtual environment
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_actual_key
```

### 5. Run ingestion (one time — or after changing documents)
```bash
cd backend
python -m ingestion.ingest
```

### 6. Start the backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 7. Start the frontend (React + Tailwind)
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The API docs are available at: http://localhost:8000/docs

---

## Chunking Strategy

Documents are split on `##` markdown headings. This works well because:
- Policy documents are already structured with clear sections
- Each section is self-contained and has enough context on its own
- Heading-based splits avoid cutting mid-sentence

If a section exceeds ~1600 characters (~400 tokens), it is further split with a 200-character overlap to preserve context across boundaries.

---

## Embedding Model

`models/gemini-embedding-001` (Google Gemini) — 3072-dimensional dense vectors.  
Used with `task_type="retrieval_document"` during ingestion and `task_type="retrieval_query"` at query time, which optimises the embeddings for asymmetric retrieval.

---

## Vector Database

**Custom JSON-backed vector store** with NumPy cosine similarity, persisted at `backend/vector_store_data/store.json`.  
No external vector database is required — pure Python with NumPy. Distances are stored as `1 - cosine_similarity` to match ChromaDB-style conventions.

---

## Retrieval Approach

- **top_k = 4** chunks retrieved per query
- **Confidence threshold = 0.35** similarity score — queries with no chunk above this score return the fallback message without calling the LLM, preventing hallucination

---

## Agent and Tool Implementation

The agent uses Gemini's native function-calling API. The loop:
1. Sends the user message + conversation history + tool descriptions to Gemini
2. If Gemini requests a tool call, the tool is executed and the result is sent back
3. Repeats up to 5 iterations
4. Returns the final text answer, sources cited, and tools used

**Tools:**
- `search_company_documents(query)` — searches the custom JSON vector store, generates answer via RAG
- `get_employee_info(employee_id)` — looks up the mock employee database
- `apply_leave(employee_id, start_date, end_date, reason)` — validates dates and balance, deducts if successful

**Security**: `apply_leave` always uses the authenticated employee's ID from the request, regardless of what the model passes — preventing employees from applying leave on behalf of others.

---

## Sample Queries and Outputs

See [`docs/sample_queries.md`](docs/sample_queries.md).

---

## API Reference

See [`docs/api.md`](docs/api.md) for the full endpoint reference with request/response schemas, curl examples, and error codes.

The auto-generated Swagger UI is also available at: http://localhost:8000/docs

---

## Assumptions

- Leave balance is stored in-memory; restarting the server resets it to the values in `employees.json`
- Conversation history is in-memory per session; restarting the server clears all sessions
- "Days" in leave calculation = calendar days (including weekends), consistent with the assessment example
- The employee's ID is passed in every API request (e.g., from a login system); users do not need to identify themselves in the chat

---

## Limitations

- No persistent session storage (in-memory only)
- No authentication layer (employee ID is trusted as-is from the request)
- Leave balance resets on server restart
- Only `.txt` files are supported; PDF ingestion would require a PDF parsing library

---

## What I Would Change With More Time

1. Persistent session storage (Redis or database)
2. PDF document support via `pymupdf` or `pdfplumber`
3. Streaming responses from Gemini to the frontend
4. Unit tests for all three tools and the retriever
5. Docker Compose setup for one-command startup
6. Reranking and metadata filtering
7. Swap the JSON vector store for ChromaDB or Qdrant for production scale
