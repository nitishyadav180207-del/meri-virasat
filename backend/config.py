"""
Centralized configuration for the Meri Virasat backend.

Keeping these values in one place (instead of scattered magic strings across
routers) makes them easy to find, override via environment variables, and
keeps the routers focused on request handling rather than configuration.
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- database ---
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./heritage.db")

# --- file storage ---
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))

# --- CORS ---
# "*" is fine for local hackathon development; restrict this to the deployed
# frontend's origin before shipping to production.
CORS_ALLOW_ORIGINS = os.environ.get("CORS_ALLOW_ORIGINS", "*").split(",")

# --- speech-to-text ---
# "tiny"/"base" trade accuracy for speed — good for live demos on CPU-only
# machines. Use "small" or "medium" for better accuracy if you have a GPU.
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "tiny")

# --- auth ---
# Dev-only default — set a real secret via the SECRET_KEY env var before
# deploying anywhere other than local/hackathon use.
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))

# --- community verification ---
# Number of confirmations a record needs before its status flips to "verified".
VERIFICATION_THRESHOLD = int(os.environ.get("VERIFICATION_THRESHOLD", "3"))

# --- risk scoring weights ---
# How much each signal contributes to the final 0-100 risk score.
RISK_WEIGHT_FREQUENCY = 0.4
RISK_WEIGHT_YOUTH = 0.4
RISK_WEIGHT_ELDERS = 0.2

RISK_BAND_RED_THRESHOLD = 70
RISK_BAND_YELLOW_THRESHOLD = 40

PRACTICE_FREQUENCY_RISK_WEIGHTS = {
    "daily": 0,
    "weekly": 15,
    "monthly": 30,
    "rare": 60,
    "declining": 70,
    "none": 90,
    "unknown": 40,
}
