"""
Pydantic schemas — request/response validation for the API.

Field constraints here (ge=0, min_length, etc.) are enforced by FastAPI
automatically and documented in the /docs page — they don't change behavior
for already-valid requests, they just make invalid ones fail with a clear
422 instead of silently producing a nonsensical record.
"""
import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    mobile: str = ""
    address: str = ""
    state: str = ""
    district: str = ""
    profile_picture_url: Optional[str] = None
    craft_category: str = ""
    years_experience: str = ""
    about_craft: str = ""
    craft_photo_urls: List[str] = Field(default_factory=list)
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class HeritageCreate(BaseModel):
    title: str = Field(..., min_length=1, description="Name of the place or tradition.")
    category: str = Field(..., min_length=1)
    description: Optional[str] = ""
    location_name: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    known_elders: Optional[int] = Field(0, ge=0)
    young_practitioners: Optional[int] = Field(0, ge=0)
    practice_frequency: Optional[str] = "unknown"


class HeritageUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    known_elders: Optional[int] = Field(None, ge=0)
    young_practitioners: Optional[int] = Field(None, ge=0)
    practice_frequency: Optional[str] = None
    status: Optional[str] = None


class HeritageOut(BaseModel):
    id: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    title: str
    category: str
    description: str
    location_name: str = ""
    latitude: Optional[float]
    longitude: Optional[float]
    media_urls: List[str] = Field(default_factory=list)
    transcript: str
    known_elders: int
    young_practitioners: int
    practice_frequency: str
    risk_score: float
    risk_band: str
    verification_count: int
    evidence_notes: List[str] = Field(default_factory=list)
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class RiskScoreRequest(BaseModel):
    known_elders: int = Field(..., ge=0)
    young_practitioners: int = Field(..., ge=0)
    practice_frequency: str  # daily/weekly/monthly/rare/declining/none


class RiskScoreResponse(BaseModel):
    risk_score: float
    risk_band: str  # green/yellow/red
    explanation: str


class VerifyRequest(BaseModel):
    note: Optional[str] = Field(None, description='e.g. "Confirmed by village elder Ramesh"')


class TranscribeResponse(BaseModel):
    transcript: str


class DashboardEntry(BaseModel):
    """A compact view of a heritage record for the at-risk dashboard."""

    id: str
    title: str
    category: str
    risk_score: float
    risk_band: str
    verification_count: int
    status: str

    class Config:
        from_attributes = True
