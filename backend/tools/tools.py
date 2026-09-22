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
from logger import get_logger

log = get_logger("tools")

# ---------------------------------------------------------------------------
# Employee data — loaded once, kept in memory (changes survive the session)
# ---------------------------------------------------------------------------
def _load_employees() -> dict:
    with open(EMPLOYEES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


_EMPLOYEES: dict = _load_employees()


# ---------------------------------------------------------------------------
# Tool 1 — Company Knowledge Search
# ---------------------------------------------------------------------------
def search_company_documents(query: str) -> dict:
    """Search the vector database for policy and FAQ information."""
    from rag.retriever import answer as rag_answer
    return rag_answer(query)


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

    _EMPLOYEES[emp_id]["leave_balance"] -= days_requested
    log.info(
        "apply_leave | success: %s, days=%d, new_balance=%d",
        emp["name"], days_requested, _EMPLOYEES[emp_id]["leave_balance"],
    )
    return {
        "status": "success",
        "message": (
            f"Leave application submitted successfully for {emp['name']} "
            f"from {start_date} to {end_date} ({days_requested} day(s)). "
            f"Remaining balance: {_EMPLOYEES[emp_id]['leave_balance']} day(s)."
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
