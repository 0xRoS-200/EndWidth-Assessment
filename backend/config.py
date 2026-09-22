import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
VECTOR_STORE_PATH = os.getenv("VECTOR_STORE_PATH", "./backend/vector_store_data/store.json")
TOP_K = int(os.getenv("TOP_K", "4"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35"))
DOCUMENTS_PATH = os.path.join(os.path.dirname(__file__), "documents")
EMPLOYEES_PATH = os.path.join(os.path.dirname(__file__), "data", "employees.json")

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_before_production_use_a_long_random_string")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))
