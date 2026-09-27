"""
Unit tests for backend/database/db.py (SQLite relational persistent storage).
"""
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.db import (
    init_db,
    get_employee,
    get_all_employees,
    update_leave_balance,
    record_leave_application,
    get_leave_applications,
    save_chat_message,
    get_session_history,
    clear_session_history,
)


@pytest.fixture
def temp_db():
    """Fixture providing a temporary SQLite database file for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name
    
    init_db(db_path)
    yield db_path

    if os.path.exists(db_path):
        os.remove(db_path)


def test_database_init_and_seeding(temp_db):
    employees = get_all_employees(temp_db)
    assert len(employees) >= 3
    assert "EMP001" in employees
    assert employees["EMP001"]["name"] == "Rahul Sharma"
    assert employees["EMP001"]["department"] == "Engineering"


def test_get_employee(temp_db):
    emp = get_employee("EMP002", temp_db)
    assert emp is not None
    assert emp["employee_id"] == "EMP002"
    assert emp["name"] == "Priya Nair"

    unknown = get_employee("EMP999", temp_db)
    assert unknown is None


def test_update_leave_balance(temp_db):
    emp = get_employee("EMP001", temp_db)
    initial_balance = emp["leave_balance"]

    updated = update_leave_balance("EMP001", initial_balance - 3, temp_db)
    assert updated is True

    emp_after = get_employee("EMP001", temp_db)
    assert emp_after["leave_balance"] == initial_balance - 3


def test_record_and_get_leave_applications(temp_db):
    app_id = record_leave_application(
        employee_id="EMP001",
        start_date="2026-10-01",
        end_date="2026-10-03",
        reason="Vacation",
        days_requested=3,
        db_path=temp_db,
    )
    assert app_id > 0

    apps = get_leave_applications("EMP001", temp_db)
    assert len(apps) == 1
    assert apps[0]["reason"] == "Vacation"
    assert apps[0]["days_requested"] == 3
    assert apps[0]["status"] == "APPROVED"


def test_chat_session_history_persistence(temp_db):
    session_id = "test-session-123"

    save_chat_message(session_id, "EMP001", "user", "What is the WFH policy?", temp_db)
    save_chat_message(session_id, "EMP001", "model", "You can work from home 2 days a week.", temp_db)

    history = get_session_history(session_id, db_path=temp_db)
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["parts"] == ["What is the WFH policy?"]
    assert history[1]["role"] == "model"
    assert history[1]["parts"] == ["You can work from home 2 days a week."]

    clear_session_history(session_id, temp_db)
    cleared_history = get_session_history(session_id, db_path=temp_db)
    assert len(cleared_history) == 0
