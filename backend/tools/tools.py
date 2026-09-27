"""
The three agent tools: document search, employee info, apply leave.
Each function works independently — no LLM dependency here.
"""
import json
import os
import sys
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import EMPLOYEES_PATH
from database.db import (
    get_employee,
    get_all_employees,
    update_leave_balance,
    record_leave_application,
)
from logger import get_logger

log = get_logger("tools")

# ---------------------------------------------------------------------------
# Employee data — loaded from/persisted to SQLite DB with in-memory proxy
# ---------------------------------------------------------------------------
def _load_employees_initial() -> dict:
    if os.path.exists(EMPLOYEES_PATH):
        with open(EMPLOYEES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


class _EmployeesProxy(dict):
    """
    Proxy dict that reads from and writes to the persistent SQLite database,
    falling back to in-memory dict if DB is unreachable or during unit tests.
    """
    def get(self, key, default=None):
        emp_id = str(key).upper()
        try:
            db_emp = get_employee(emp_id)
            if db_emp:
                super().__setitem__(emp_id, db_emp)
                return db_emp
        except Exception:
            pass
        return super().get(emp_id, super().get(key, default))

    def __getitem__(self, key):
        emp_id = str(key).upper()
        try:
            db_emp = get_employee(emp_id)
            if db_emp:
                super().__setitem__(emp_id, db_emp)
                return db_emp
        except Exception:
            pass
        return super().__getitem__(key)


_EMPLOYEES: dict = _EmployeesProxy(_load_employees_initial())


# ---------------------------------------------------------------------------
# Tool 1 — Company Knowledge Search
# ---------------------------------------------------------------------------
_SEARCH_CACHE: dict = {}


def search_company_documents(query: str) -> dict:
    """Search the vector database for policy and FAQ information."""
    key = query.strip().lower()
    if "pytest" not in sys.modules and key in _SEARCH_CACHE:
        log.info("search_company_documents | returning cached result for: %r", query[:40])
        return _SEARCH_CACHE[key]

    from rag.retriever import retrieve, CONFIDENCE_THRESHOLD, FALLBACK
    chunks = retrieve(query)
    relevant = [c for c in chunks if c.get("rerank_score", 0) >= CONFIDENCE_THRESHOLD]
    if not relevant:
        res = {"context": FALLBACK, "sources": []}
    else:
        context = "\n\n".join(f"[Source: {c['source']}]\n{c['text']}" for c in relevant)
        sources = list({c["source"] for c in relevant})
        res = {"context": context, "sources": sources}

    if "pytest" not in sys.modules:
        _SEARCH_CACHE[key] = res
    return res


# ---------------------------------------------------------------------------
# Tool 2 — Employee Information
# ---------------------------------------------------------------------------
def get_employee_info(employee_id: str) -> dict:
    """Return employee details. Returns an error dict if the ID is unknown."""
    log.info("get_employee_info | employee_id=%s", employee_id)
    emp = _EMPLOYEES.get(employee_id.upper())
    if not emp:
        log.warning("get_employee_info | unknown employee: %s", employee_id)
        return {"error": f"Employee ID '{employee_id}' not found."}
    result = {
        "employee_id": employee_id.upper(),
        "name": emp["name"],
        "department": emp["department"],
        "role": emp["role"],
        "leave_balance": emp["leave_balance"],
    }
    log.info("get_employee_info | result: name=%s, balance=%d", emp["name"], emp["leave_balance"])
    return result


# ---------------------------------------------------------------------------
# Tool 3 — Apply Leave
# ---------------------------------------------------------------------------
def apply_leave(employee_id: str, start_date: str, end_date: str, reason: str) -> dict:
    """
    Apply leave for an employee. Validates dates and balance, then deducts.
    Dates must be in YYYY-MM-DD format.
    """
    log.info(
        "apply_leave | emp=%s, start=%s, end=%s, reason=%r",
        employee_id, start_date, end_date, reason[:40],
    )
    emp_id = employee_id.upper()
    emp = _EMPLOYEES.get(emp_id)
    if not emp:
        log.warning("apply_leave | unknown employee: %s", employee_id)
        return {"status": "failure", "message": f"Employee ID '{employee_id}' not found."}

    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        log.warning("apply_leave | invalid date format: start=%s end=%s", start_date, end_date)
        return {"status": "failure", "message": "Invalid date format. Use YYYY-MM-DD."}

    if start < date.today():
        log.warning("apply_leave | past date requested: start=%s (today=%s)", start_date, date.today())
        return {"status": "failure", "message": "Cannot apply for leave on past dates. Start date must be today or in the future."}

    if end < start:
        log.warning("apply_leave | end date before start date")
        return {"status": "failure", "message": "End date cannot be before start date."}

    days_requested = (end - start).days + 1

    balance = emp["leave_balance"]
    if days_requested > balance:
        log.warning(
            "apply_leave | insufficient balance: requested=%d, available=%d",
            days_requested, balance,
        )
        return {
            "status": "failure",
            "message": (
                f"Insufficient leave balance. Requested {days_requested} day(s), "
                f"but {emp['name']} only has {balance} day(s) remaining."
            ),
        }

    new_balance = balance - days_requested
    try:
        update_leave_balance(emp_id, new_balance)
        record_leave_application(emp_id, start_date, end_date, reason, days_requested)
    except Exception as e:
        log.warning("apply_leave | database update error: %s", e)

    if emp_id in _EMPLOYEES:
        _EMPLOYEES[emp_id]["leave_balance"] = new_balance

    log.info(
        "apply_leave | success: %s, days=%d, new_balance=%d",
        emp["name"], days_requested, new_balance,
    )
    return {
        "status": "success",
        "message": (
            f"Leave application submitted successfully for {emp['name']} "
            f"from {start_date} to {end_date} ({days_requested} day(s)). "
            f"Remaining balance: {new_balance} day(s)."
        ),
    }


# ---------------------------------------------------------------------------
# Tool descriptions — passed to the LLM so it can decide which to call
# ---------------------------------------------------------------------------
TOOL_DESCRIPTIONS = [
    {
        "name": "search_company_documents",
        "description": (
            "Search company policy documents and FAQs. Use this tool for any question about company policies, "
            "rules, benefits, IT guidelines, travel policy, leave policy, work-from-home policy, or any "
            "general company information. Do NOT use this for personal employee data like leave balance."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The question to search for in company documents."}
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_employee_info",
        "description": (
            "Retrieve personal employee information including name, department, role, and current leave balance. "
            "Use this when the question is about a specific employee's details or remaining leave days."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "employee_id": {"type": "string", "description": "The employee ID, e.g. EMP001."}
            },
            "required": ["employee_id"],
        },
    },
    {
        "name": "apply_leave",
        "description": (
            "Submit a leave application for an employee. Use this when the employee explicitly asks to apply, "
            "book, or request leave for specific dates. Always check the employee's leave balance first using "
            "get_employee_info before calling this tool."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "employee_id": {"type": "string", "description": "The employee ID."},
                "start_date": {"type": "string", "description": "Leave start date in YYYY-MM-DD format."},
                "end_date": {"type": "string", "description": "Leave end date in YYYY-MM-DD format."},
                "reason": {"type": "string", "description": "Reason for taking leave."},
            },
            "required": ["employee_id", "start_date", "end_date", "reason"],
        },
    },
]

# Map tool name → function for the agent loop
TOOL_REGISTRY = {
    "search_company_documents": search_company_documents,
    "get_employee_info": get_employee_info,
    "apply_leave": apply_leave,
}


if __name__ == "__main__":
    # Smoke test all three tools
    print("=== get_employee_info ===")
    print(get_employee_info("EMP001"))
    print(get_employee_info("EMP999"))

    print("\n=== apply_leave (valid) ===")
    print(apply_leave("EMP001", "2026-10-01", "2026-10-03", "Personal"))

    print("\n=== apply_leave (insufficient balance) ===")
    print(apply_leave("EMP003", "2026-10-01", "2026-10-10", "Vacation"))

    print("\n=== apply_leave (bad dates) ===")
    print(apply_leave("EMP001", "2026-10-05", "2026-10-01", "Vacation"))

    print("\n=== search_company_documents ===")
    result = search_company_documents("What is the work from home policy?")
    print(f"Answer: {result['answer'][:200]}")
    print(f"Sources: {result['sources']}")
