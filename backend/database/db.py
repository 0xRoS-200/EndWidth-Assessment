"""
SQLite database module for persistent storage.

Provides relational persistence for:
- Employee profiles & leave balances
- Submitted leave applications
- Chat session histories
"""
import json
import os
import sqlite3
import sys
from typing import Optional, List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import DATABASE_PATH, EMPLOYEES_PATH
from logger import get_logger

log = get_logger("database")


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Return a SQLite connection with row factory configured."""
    target_path = db_path or DATABASE_PATH
    if target_path != ":memory:":
        os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Optional[str] = None):
    """
    Initialize SQLite database schema and seed initial employee data
    from employees.json if the employees table is empty.
    """
    target_path = db_path or DATABASE_PATH
    log.info("Initializing database at: %s", target_path)

    conn = get_connection(target_path)
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS employees (
                    employee_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    department TEXT NOT NULL,
                    role TEXT NOT NULL,
                    leave_balance INTEGER NOT NULL,
                    password_hash TEXT NOT NULL
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS leave_applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_id TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    days_requested INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'APPROVED',
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id TEXT PRIMARY KEY,
                    employee_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id) ON DELETE CASCADE
                );
            """)

            # Seed employee data if table is empty
            cursor = conn.execute("SELECT COUNT(*) FROM employees;")
            count = cursor.fetchone()[0]

            if count == 0 and os.path.exists(EMPLOYEES_PATH):
                log.info("Seeding initial employee data from %s", EMPLOYEES_PATH)
                with open(EMPLOYEES_PATH, "r", encoding="utf-8") as f:
                    emp_data = json.load(f)
                    for emp_id, emp in emp_data.items():
                        conn.execute(
                            """
                            INSERT OR REPLACE INTO employees 
                            (employee_id, name, department, role, leave_balance, password_hash)
                            VALUES (?, ?, ?, ?, ?, ?);
                            """,
                            (
                                emp_id.upper(),
                                emp["name"],
                                emp["department"],
                                emp["role"],
                                emp["leave_balance"],
                                emp.get("password_hash", ""),
                            ),
                        )
                log.info("Successfully seeded %d employees into database.", len(emp_data))
    finally:
        conn.close()


def get_employee(employee_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve an employee record by ID."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT employee_id, name, department, role, leave_balance, password_hash FROM employees WHERE employee_id = ?;",
            (employee_id.upper(),),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
    finally:
        conn.close()


def get_all_employees(db_path: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """Retrieve all employee records as a dictionary keyed by employee_id."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute("SELECT employee_id, name, department, role, leave_balance, password_hash FROM employees;")
        rows = cursor.fetchall()
        result = {}
        for row in rows:
            emp = dict(row)
            result[emp["employee_id"]] = emp
        return result
    finally:
        conn.close()


def update_leave_balance(employee_id: str, new_balance: int, db_path: Optional[str] = None) -> bool:
    """Update employee leave balance."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE employees SET leave_balance = ? WHERE employee_id = ?;",
                (new_balance, employee_id.upper()),
            )
            return cursor.rowcount > 0
    finally:
        conn.close()


def record_leave_application(
    employee_id: str,
    start_date: str,
    end_date: str,
    reason: str,
    days_requested: int,
    status: str = "APPROVED",
    db_path: Optional[str] = None,
) -> int:
    """Record a leave application in the database."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO leave_applications (employee_id, start_date, end_date, reason, days_requested, status)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (employee_id.upper(), start_date, end_date, reason, days_requested, status),
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_leave_applications(employee_id: str, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all leave applications for an employee."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            """
            SELECT id, employee_id, start_date, end_date, reason, days_requested, status, applied_at
            FROM leave_applications WHERE employee_id = ? ORDER BY id DESC;
            """,
            (employee_id.upper(),),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def save_chat_message(session_id: str, employee_id: str, role: str, content: str, db_path: Optional[str] = None):
    """Save a chat message to persistent database history."""
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                "INSERT OR IGNORE INTO chat_sessions (session_id, employee_id) VALUES (?, ?);",
                (session_id, employee_id.upper()),
            )
            conn.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?);",
                (session_id, role, content),
            )
    finally:
        conn.close()


def get_session_history(session_id: str, limit_pairs: int = 10, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve chat session history from database."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            """
            SELECT role, content FROM chat_messages 
            WHERE session_id = ? ORDER BY id ASC;
            """,
            (session_id,),
        )
        rows = cursor.fetchall()
        messages = [{"role": row["role"], "parts": [row["content"]]} for row in rows]
        max_entries = limit_pairs * 2
        if len(messages) > max_entries:
            messages = messages[-max_entries:]
        return messages
    finally:
        conn.close()


def clear_session_history(session_id: str, db_path: Optional[str] = None):
    """Delete chat history for a session from database."""
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute("DELETE FROM chat_sessions WHERE session_id = ?;", (session_id,))
    finally:
        conn.close()
