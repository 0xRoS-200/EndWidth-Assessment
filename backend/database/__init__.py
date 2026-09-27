"""
Database package for persistent SQLite storage of employees, leave requests, and chat sessions.
"""
from database.db import (
    init_db,
    get_connection,
    get_employee,
    get_all_employees,
    update_leave_balance,
    record_leave_application,
    get_leave_applications,
    save_chat_message,
    get_session_history,
    clear_session_history,
)

__all__ = [
    "init_db",
    "get_connection",
    "get_employee",
    "get_all_employees",
    "update_leave_balance",
    "record_leave_application",
    "get_leave_applications",
    "save_chat_message",
    "get_session_history",
    "clear_session_history",
]
