"""
Ingestion pipeline: load documents → chunk → embed → store in vector store.
Run with: python -m ingestion.ingest  (from the backend/ directory)
"""
import os
import sys
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import google.generativeai as genai

from config import GEMINI_API_KEY, EMBEDDING_MODEL, VECTOR_STORE_PATH, DOCUMENTS_PATH
from vector_store.store import VectorStore

genai.configure(api_key=GEMINI_API_KEY)

MAX_CHUNK_CHARS = 1600   # ~400 tokens
OVERLAP_CHARS = 200


def load_documents(docs_path: str) -> list[dict]:
    """Load all .txt files from the documents directory."""
    docs = []
    for filename in sorted(os.listdir(docs_path)):
        if filename.endswith(".txt"):
            filepath = os.path.join(docs_path, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            docs.append({"filename": filename, "content": content})
    return docs


def split_by_heading(text: str) -> list[str]:
    """Split a document on '## ' markdown headings."""
    sections = []
    current = []
    for line in text.splitlines(keepends=True):
        if line.startswith("## ") and current:
            sections.append("".join(current).strip())
            current = [line]
        else:
            current.append(line)
    if current:
        sections.append("".join(current).strip())
    return [s for s in sections if s]


def split_long_section(text: str) -> list[str]:
    """Further split a section that exceeds MAX_CHUNK_CHARS, with overlap."""
    if len(text) <= MAX_CHUNK_CHARS:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + MAX_CHUNK_CHARS
        chunks.append(text[start:end])
        start = end - OVERLAP_CHARS
    return chunks


def chunk_document(doc: dict) -> list[dict]:
    """Split one document into chunks with metadata."""
    sections = split_by_heading(doc["content"])
    chunks = []
    idx = 0
    for section in sections:
        for part in split_long_section(section):
            if part.strip():
                chunk_id = hashlib.md5(f"{doc['filename']}_{idx}".encode()).hexdigest()
                chunks.append({
                    "id": chunk_id,
                    "text": part.strip(),
                    "source": doc["filename"],
                    "chunk_index": idx,
                })
                idx += 1
    return chunks


def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Gemini."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


def ingest():
    """Main ingestion function — safe to re-run (upserts by chunk ID)."""
    print(f"Loading documents from: {DOCUMENTS_PATH}")
    docs = load_documents(DOCUMENTS_PATH)
    print(f"Found {len(docs)} document(s): {[d['filename'] for d in docs]}")

    all_chunks = []
    for doc in docs:
        chunks = chunk_document(doc)
        all_chunks.extend(chunks)
        print(f"  {doc['filename']}: {len(chunks)} chunk(s)")

    print(f"\nTotal chunks to embed: {len(all_chunks)}")

    store = VectorStore(VECTOR_STORE_PATH)

    ids, embeddings, documents, metadatas = [], [], [], []
    for i, chunk in enumerate(all_chunks):
        print(f"  Embedding chunk {i + 1}/{len(all_chunks)}: {chunk['source']} [{chunk['chunk_index']}]")
        emb = get_embedding(chunk["text"])
        ids.append(chunk["id"])
        embeddings.append(emb)
        documents.append(chunk["text"])
        metadatas.append({"source": chunk["source"], "chunk_index": chunk["chunk_index"]})

    store.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    print(f"\nIngestion complete. {store.count()} chunk(s) stored.")
    sample = store.peek(limit=1)
    print(f"\nSample stored chunk:")
    print(f"  ID      : {sample['ids'][0]}")
    print(f"  Source  : {sample['metadatas'][0]['source']}")
    print(f"  Preview : {sample['documents'][0][:120]}...")


if __name__ == "__main__":
    ingest()
