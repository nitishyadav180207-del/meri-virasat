"""
SQLAlchemy models for Meri Virasat.
Core entity: HeritageRecord — a Place/Story/Tradition documented by a user,
enriched with AI transcription, community verification and a risk score.
"""
import datetime
import uuid

from sqlalchemy import Column, String, Text, Float, Integer, DateTime, JSON
from sqlalchemy.orm import relationship

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)

    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    mobile = Column(String, default="")
    address = Column(String, default="")
    state = Column(String, default="")
    district = Column(String, default="")
    profile_picture_url = Column(String, nullable=True)

    craft_category = Column(String, default="")
    years_experience = Column(String, default="")
    about_craft = Column(Text, default="")
    craft_photo_urls = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HeritageRecord(Base):
    __tablename__ = "heritage_records"

    id = Column(String, primary_key=True, default=gen_uuid)

    # Nullable so pre-existing/seed records (created before accounts existed)
    # keep working — they're just not editable/deletable by anyone.
    owner_id = Column(String, nullable=True, index=True)

    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # temple, haveli, baoli, tradition, song, recipe, craft...
    description = Column(Text, default="")
    location_name = Column(String, default="")  # free-text: "Village, District, State"

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    media_urls = Column(JSON, default=list)   # list of relative paths under /uploads
    transcript = Column(Text, default="")

    # --- risk score inputs ---
    known_elders = Column(Integer, default=0)
    young_practitioners = Column(Integer, default=0)
    practice_frequency = Column(String, default="unknown")  # daily/weekly/rare/none/unknown
    risk_score = Column(Float, default=0.0)
    risk_band = Column(String, default="unknown")  # green/yellow/red

    verification_count = Column(Integer, default=0)
    evidence_notes = Column(JSON, default=list)  # list of strings

    status = Column(String, default="draft")  # draft, verified, at_risk

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
