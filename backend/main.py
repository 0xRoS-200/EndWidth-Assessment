from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from database.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial employee records
    init_db()
    yield


app = FastAPI(title="Employee AI Assistant", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
