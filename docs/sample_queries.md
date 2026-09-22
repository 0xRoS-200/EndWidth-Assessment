# Sample Queries & Expected Outputs

These examples demonstrate all key capabilities of the Employee AI Assistant.

---

## 1. RAG Retrieval — Work From Home Policy

**Query:**
```
What is the work from home policy?
```

**Expected Response:**
```
Employees can work from home up to 2 days per week with prior manager approval.
Remote work requires a stable internet connection and availability during core hours (10 AM – 4 PM).
Source: work_from_home_policy.txt
```

**Tools Used:** `search_company_documents`

---

## 2. RAG Retrieval — Annual Leave Entitlement

**Query:**
```
How many annual leave days do employees get?
```

**Expected Response:**
```
Employees are entitled to 18 days of paid annual leave per year, accrued monthly.
Unused leave up to 5 days may be carried over to the next calendar year.
Source: leave_policy.txt
```

**Tools Used:** `search_company_documents`

---

## 3. Hallucination Prevention — Pet Insurance

**Query:**
```
Does the company provide pet insurance?
```

**Expected Response:**
```
I couldn't find information about pet insurance in the provided company documents.
```

**Tools Used:** `search_company_documents`
**Sources:** *(none)*

---

## 4. Tool Calling — Employee Leave Balance

**Query (as EMP001):**
```
How many leaves do I have remaining?
```

**Expected Response:**
```
You currently have 12 days of leave remaining, Rahul.
```

**Tools Used:** `get_employee_info`

---

## 5. Multi-Tool — Policy + Personal Balance

**Query (as EMP001):**
```
What is the leave policy and how many leaves do I have?
```

**Expected Response:**
```
Leave Policy:
Employees receive 18 days of annual paid leave. Sick leave (6 days) and casual leave (6 days) are also provided.
Source: leave_policy.txt

Your Balance:
Rahul, you currently have 12 days of annual leave remaining.
```

**Tools Used:** `search_company_documents`, `get_employee_info`

---

## 6. Agent Action — Apply Leave

**Query (as EMP001):**
```
Apply leave for me from 2026-09-20 to 2026-09-22 because I'm travelling.
```

**Expected Response:**
```
Leave application submitted successfully for Rahul Sharma from 2026-09-20 to 2026-09-22 (3 days).
Remaining balance: 9 day(s).
```

**Tools Used:** `get_employee_info`, `apply_leave`

---

## 7. Conversational Context — Follow-up Question

**Turn 1:**
```
User: How many leaves do I have?
Assistant: You have 12 days of leave remaining, Rahul.
```

**Turn 2:**
```
User: Can I take 3 days next month?
Assistant: Yes, you have enough balance to take 3 days next month. Would you like me to apply the leave?
```

The assistant correctly understands "3 days" refers to leave and links back to the balance from the previous turn.

**Tools Used (Turn 2):** *(none — answered from conversation context)*

---

## 8. Insufficient Leave Balance

**Query (as EMP003 — Arjun, 5 days balance):**
```
Apply leave from 2026-10-01 to 2026-10-10 for vacation.
```

**Expected Response:**
```
Unable to apply leave: Insufficient leave balance. Requested 10 day(s), but Arjun Mehta only has 5 day(s) remaining.
```

**Tools Used:** `get_employee_info`, `apply_leave`

---

## 9. IT & Security Policy

**Query:**
```
What is the password policy?
```

**Expected Response:**
```
Passwords must be at least 12 characters long and include a mix of uppercase, lowercase, numbers, and special characters. Passwords must be changed every 90 days.
Source: it_security_policy.txt
```

**Tools Used:** `search_company_documents`

---

## 10. Travel Policy

**Query:**
```
What expenses are reimbursable when travelling for work?
```

**Expected Response:**
```
Reimbursable travel expenses include airfare (economy class), hotel accommodation, meals up to the daily per diem limit, and local transportation. Receipts are required for all claims above ₹500.
Source: travel_policy.txt
```

**Tools Used:** `search_company_documents`
