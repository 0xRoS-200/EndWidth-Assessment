"""
Unit tests for the RAG retriever module.

Vector store calls and Gemini API calls are fully mocked so these tests
run without any API key or network access.
"""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from rag.retriever import rerank, _keyword_overlap, FALLBACK


# ---------------------------------------------------------------------------
# _keyword_overlap
# ---------------------------------------------------------------------------

class TestKeywordOverlap:
    def test_full_overlap(self):
        score = _keyword_overlap("work from home policy", "work from home policy allowed")
        # meaningful words: {work, home, policy} — all present
        assert score > 0.8

    def test_zero_overlap(self):
        score = _keyword_overlap("travel reimbursement", "password security guidelines")
        assert score == 0.0

    def test_stop_words_ignored(self):
        # Query is all stop words — no meaningful keywords
        score = _keyword_overlap("the a an is are", "the a an is are were")
        assert score == 0.0

    def test_partial_overlap(self):
        score = _keyword_overlap("leave policy balance", "leave entitlement")
        # meaningful words: {leave, policy, balance} — 1 present
        assert 0.0 < score < 1.0

    def test_empty_query(self):
        score = _keyword_overlap("", "some text here")
        assert score == 0.0


# ---------------------------------------------------------------------------
# rerank
# ---------------------------------------------------------------------------

class TestRerank:
    def _make_chunks(self):
        return [
            {"text": "work from home policy allows two days per week",
             "source": "work_from_home_policy.txt", "score": 0.75},
            {"text": "travel reimbursement policy expenses",
             "source": "travel_policy.txt", "score": 0.80},
            {"text": "password security minimum twelve characters",
             "source": "it_security_policy.txt", "score": 0.65},
        ]

    def test_rerank_adds_rerank_score_field(self):
        chunks = self._make_chunks()
        result = rerank("work from home policy", chunks)
        for c in result:
            assert "rerank_score" in c
            assert "keyword_overlap" in c

    def test_rerank_score_within_bounds(self):
        chunks = self._make_chunks()
        result = rerank("work from home policy", chunks)
        for c in result:
            assert 0.0 <= c["rerank_score"] <= 1.0

    def test_result_sorted_descending_by_rerank_score(self):
        chunks = self._make_chunks()
        result = rerank("work from home policy", chunks)
        scores = [c["rerank_score"] for c in result]
        assert scores == sorted(scores, reverse=True)

    def test_keyword_boost_can_change_order(self):
        """A lower cosine-score chunk with high keyword overlap can outrank a higher cosine chunk."""
        chunks = [
            {"text": "completely unrelated content about database schemas",
             "source": "other.txt", "score": 0.90},   # high cosine, no keyword match
            {"text": "leave policy annual leave entitlement days",
             "source": "leave_policy.txt", "score": 0.60},  # lower cosine, strong keyword match
        ]
        result = rerank("leave policy days", chunks)
        # The leave_policy chunk should be ranked first due to keyword boost
        assert result[0]["source"] == "leave_policy.txt"

    def test_empty_chunks_returns_empty(self):
        result = rerank("any query", [])
        assert result == []


# ---------------------------------------------------------------------------
# answer() — end-to-end with mocked Gemini + VectorStore
# ---------------------------------------------------------------------------

class TestAnswer:
    def _make_mock_store_result(self, docs, sources, distances):
        return {
            "ids": [["id1", "id2"]],
            "documents": [docs],
            "metadatas": [[{"source": s} for s in sources]],
            "distances": [distances],
        }

    @patch("rag.retriever.genai.embed_content")
    @patch("rag.retriever.VectorStore")
    @patch("rag.retriever.genai.GenerativeModel")
    def test_answer_returns_answer_and_sources(
        self, mock_model_cls, mock_store_cls, mock_embed
    ):
        # Mock embedding
        mock_embed.return_value = {"embedding": [0.1] * 10}

        # Mock vector store
        mock_store = MagicMock()
        mock_store.query.return_value = self._make_mock_store_result(
            docs=["Employees can work from home 2 days a week."],
            sources=["work_from_home_policy.txt"],
            distances=[0.1],  # similarity = 0.9
        )
        mock_store_cls.return_value = mock_store

        # Mock LLM response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Employees can work from home 2 days per week with manager approval."
        mock_model.generate_content.return_value = mock_response
        mock_model_cls.return_value = mock_model

        from rag.retriever import answer
        result = answer("What is the work from home policy?")

        assert "answer" in result
        assert "sources" in result
        assert "work_from_home_policy.txt" in result["sources"]
        assert len(result["answer"]) > 0

    @patch("rag.retriever.genai.embed_content")
    @patch("rag.retriever.VectorStore")
    def test_answer_returns_fallback_when_no_relevant_chunks(
        self, mock_store_cls, mock_embed
    ):
        mock_embed.return_value = {"embedding": [0.1] * 10}

        # Return chunks with very low similarity (below threshold)
        mock_store = MagicMock()
        mock_store.query.return_value = self._make_mock_store_result(
            docs=["Some unrelated text."],
            sources=["other.txt"],
            distances=[0.99],  # similarity = 0.01 — below 0.35 threshold
        )
        mock_store_cls.return_value = mock_store

        from rag.retriever import answer
        result = answer("Does the company provide pet insurance?")

        assert result["answer"] == FALLBACK
        assert result["sources"] == []
