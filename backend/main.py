"""
Meri Virasat — FastAPI backend entrypoint.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Then open http://localhost:8000/docs for interactive API docs.
The frontend (Vite dev server or `npm run build` + any static host) talks to
this API over HTTP; see README.md for how to point it at a different host.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ALLOW_ORIGINS, UPLOAD_DIR
from database import Base, engine, run_startup_migrations
from routers import ai, auth, dashboard, geocode, heritage, verification
from services.stt_service import preload_model

# Create DB tables on startup. Fine for SQLite/hackathon use — swap for
# Alembic migrations before running this against a production database.
Base.metadata.create_all(bind=engine)
run_startup_migrations()

app = FastAPI(
    title="Meri Virasat API",
    description="India's hidden & living heritage — discover, document, preserve.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded photos/audio at /uploads/<filename>
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(heritage.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(geocode.router, prefix="/api")


@app.on_event("startup")
def _warm_whisper_model() -> None:
    """Load Whisper into memory now so the first audio submit doesn't pay
    for the multi-second model load on top of transcription itself."""
    preload_model()


@app.get("/")
def root() -> dict:
    """Basic liveness/info endpoint."""
    return {"message": "Meri Virasat API is running. Visit /docs for the API explorer."}
