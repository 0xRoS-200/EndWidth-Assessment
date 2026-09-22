"""Shared pytest fixtures for the backend test suite."""
import json
import os
import sys
import pytest

# Make backend/ importable from any test file
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def sample_employees():
    """In-memory employee dict that mirrors employees.json structure."""
    return {
        "EMP001": {
            "name": "Rahul Sharma",
            "department": "Engineering",
            "role": "Software Engineer",
            "leave_balance": 12,
        },
        "EMP002": {
            "name": "Priya Nair",
            "department": "HR",
            "role": "HR Business Partner",
            "leave_balance": 8,
        },
        "EMP003": {
            "name": "Arjun Mehta",
            "department": "Finance",
            "role": "Financial Analyst",
            "leave_balance": 5,
        },
    }
