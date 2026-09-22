"""
Unit tests for the three agent tools: get_employee_info, apply_leave,
search_company_documents.

Tools are tested in isolation (no LLM calls). The employee in-memory store
is patched via monkeypatch so tests don't mutate the real data.
"""
import os
import sys
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import tools.tools as tools_module
from tools.tools import get_employee_info, apply_leave


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_employees(sample_employees):
    """Patch the in-memory employee store before each test and restore after."""
    original = tools_module._EMPLOYEES.copy()
    # Deep-copy so nested dicts are fresh
    tools_module._EMPLOYEES = {k: dict(v) for k, v in sample_employees.items()}
    yield
    tools_module._EMPLOYEES = original


# ---------------------------------------------------------------------------
# get_employee_info
# ---------------------------------------------------------------------------

class TestGetEmployeeInfo:
    def test_valid_employee_returns_correct_fields(self):
        result = get_employee_info("EMP001")
        assert result["employee_id"] == "EMP001"
        assert result["name"] == "Rahul Sharma"
        assert result["department"] == "Engineering"
        assert result["leave_balance"] == 12
        assert "role" in result

    def test_lowercase_id_is_normalised(self):
        """Tool should accept 'emp001' and normalise to 'EMP001'."""
        result = get_employee_info("emp001")
        assert result["employee_id"] == "EMP001"

    def test_unknown_employee_returns_error(self):
        result = get_employee_info("EMP999")
        assert "error" in result
        assert "EMP999" in result["error"]

    def test_all_sample_employees_retrievable(self, sample_employees):
        for emp_id in sample_employees:
            result = get_employee_info(emp_id)
            assert "error" not in result
            assert result["name"] == sample_employees[emp_id]["name"]


# ---------------------------------------------------------------------------
# apply_leave
# ---------------------------------------------------------------------------

class TestApplyLeave:
    def test_valid_leave_deducts_balance(self):
        # EMP001 has 12 days; request 3 days
        result = apply_leave("EMP001", "2026-10-01", "2026-10-03", "Personal trip")
        assert result["status"] == "success"
        assert tools_module._EMPLOYEES["EMP001"]["leave_balance"] == 9

    def test_success_message_contains_expected_fields(self):
        result = apply_leave("EMP001", "2026-10-01", "2026-10-01", "Personal")
        assert result["status"] == "success"
        assert "Rahul Sharma" in result["message"]
        assert "2026-10-01" in result["message"]

    def test_insufficient_balance_returns_failure(self):
        # EMP003 has 5 days; request 10
        result = apply_leave("EMP003", "2026-10-01", "2026-10-10", "Vacation")
        assert result["status"] == "failure"
        assert "Insufficient" in result["message"]

    def test_end_before_start_returns_failure(self):
        result = apply_leave("EMP001", "2026-10-05", "2026-10-01", "Vacation")
        assert result["status"] == "failure"
        assert "End date" in result["message"]

    def test_invalid_date_format_returns_failure(self):
        result = apply_leave("EMP001", "01-10-2026", "03-10-2026", "Trip")
        assert result["status"] == "failure"
        assert "Invalid date" in result["message"]

    def test_unknown_employee_returns_failure(self):
        result = apply_leave("EMP999", "2026-10-01", "2026-10-03", "Trip")
        assert result["status"] == "failure"
        assert "not found" in result["message"]

    def test_balance_not_mutated_on_failure(self):
        original_balance = tools_module._EMPLOYEES["EMP001"]["leave_balance"]
        apply_leave("EMP001", "2026-10-05", "2026-10-01", "Bad dates")  # will fail
        assert tools_module._EMPLOYEES["EMP001"]["leave_balance"] == original_balance

    def test_exact_balance_succeeds(self):
        """Applying exactly the remaining balance should succeed."""
        # EMP003 has 5 days
        result = apply_leave("EMP003", "2026-10-01", "2026-10-05", "Full balance")
        assert result["status"] == "success"
        assert tools_module._EMPLOYEES["EMP003"]["leave_balance"] == 0

    def test_single_day_leave(self):
        result = apply_leave("EMP001", "2026-10-01", "2026-10-01", "Doctor")
        assert result["status"] == "success"
        assert tools_module._EMPLOYEES["EMP001"]["leave_balance"] == 11
