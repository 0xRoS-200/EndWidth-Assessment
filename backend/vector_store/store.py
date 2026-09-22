"""
Simple JSON-backed vector store using numpy cosine similarity.
No external vector database required — pure Python, zero compilation.
"""
import json
import os
import numpy as np


class VectorStore:
    """
    Stores document chunks, their embeddings, and metadata in a JSON file.
    Cosine similarity is computed with numpy.
    Supports upsert-by-ID so ingestion is safe to re-run.
    """

    def __init__(self, store_path: str):
        self.store_path = store_path
        os.makedirs(os.path.dirname(store_path), exist_ok=True)
        self._data: dict = self._load()

    def _load(self) -> dict:
        if os.path.exists(self.store_path):
            with open(self.store_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"ids": [], "embeddings": [], "documents": [], "metadatas": []}

    def _save(self):
        with open(self.store_path, "w", encoding="utf-8") as f:
            json.dump(self._data, f)

    def count(self) -> int:
        return len(self._data["ids"])

    def upsert(self, ids: list, embeddings: list, documents: list, metadatas: list):
        """Insert or update chunks by ID."""
        existing_ids = self._data["ids"]
        for i, doc_id in enumerate(ids):
            if doc_id in existing_ids:
                idx = existing_ids.index(doc_id)
                self._data["embeddings"][idx] = embeddings[i]
                self._data["documents"][idx] = documents[i]
                self._data["metadatas"][idx] = metadatas[i]
            else:
                self._data["ids"].append(doc_id)
                self._data["embeddings"].append(embeddings[i])
                self._data["documents"].append(documents[i])
                self._data["metadatas"].append(metadatas[i])
        self._save()

    def query(self, query_embedding: list, n_results: int = 4) -> dict:
        """Return the top-n most similar documents by cosine similarity."""
        if not self._data["ids"]:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        stored = np.array(self._data["embeddings"], dtype=np.float32)
        q = np.array(query_embedding, dtype=np.float32)

        # Cosine similarity: dot / (|q| * |stored|)
        q_norm = q / (np.linalg.norm(q) + 1e-10)
        stored_norms = stored / (np.linalg.norm(stored, axis=1, keepdims=True) + 1e-10)
        similarities = stored_norms @ q_norm  # shape: (n_chunks,)

        n = min(n_results, len(similarities))
        top_indices = np.argsort(similarities)[::-1][:n]

        # Convert similarity → distance (ChromaDB-style: distance = 1 - similarity)
        # so that our existing score calculation (1 - dist/2) still works correctly
        # Here we return 1 - similarity directly as distance for simplicity
        return {
            "ids": [[self._data["ids"][i] for i in top_indices]],
            "documents": [[self._data["documents"][i] for i in top_indices]],
            "metadatas": [[self._data["metadatas"][i] for i in top_indices]],
            "distances": [[float(1.0 - similarities[i]) for i in top_indices]],
        }

    def peek(self, limit: int = 1) -> dict:
        """Return a sample of stored items for inspection."""
        n = min(limit, len(self._data["ids"]))
        return {
            "ids": self._data["ids"][:n],
            "documents": self._data["documents"][:n],
            "metadatas": self._data["metadatas"][:n],
        }
