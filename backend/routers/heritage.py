"""
CRUD endpoints for heritage records, plus media upload.
"""
import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from auth import get_current_user
from config import UPLOAD_DIR
from database import get_db
from models import HeritageRecord, User
from schemas import HeritageCreate, HeritageOut, HeritageUpdate
from services.risk_service import calculate_risk_score

router = APIRouter(prefix="/heritage", tags=["heritage"])

os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_record_or_404(db: Session, record_id: str) -> HeritageRecord:
    """Fetch a heritage record by id, or raise a 404 if it doesn't exist.

    Shared by every endpoint below that operates on a single record, so the
    "not found" behavior stays consistent in one place.
    """
    record = db.query(HeritageRecord).filter(HeritageRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Heritage record not found")
    return record


def _require_owner(record: HeritageRecord, current_user: User) -> None:
    """Only the user who created a record may change or delete it."""
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own records")


def _attach_owner_name(db: Session, record: HeritageRecord) -> HeritageRecord:
    """Sets a transient `owner_name` (not a DB column) so the frontend can
    show who contributed a record without a separate lookup per card."""
    record.owner_name = None
    if record.owner_id:
        owner = db.query(User).filter(User.id == record.owner_id).first()
        record.owner_name = owner.full_name if owner else None
    return record


def _attach_owner_names(db: Session, records: List[HeritageRecord]) -> List[HeritageRecord]:
    """Batch version of _attach_owner_name — one query for the whole list
    instead of one per record."""
    owner_ids = {r.owner_id for r in records if r.owner_id}
    names_by_id = {}
    if owner_ids:
        owners = db.query(User.id, User.full_name).filter(User.id.in_(owner_ids)).all()
        names_by_id = dict(owners)
    for record in records:
        record.owner_name = names_by_id.get(record.owner_id)
    return records


@router.post("", response_model=HeritageOut)
def create_heritage(
    payload: HeritageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HeritageRecord:
    """Create a new heritage record. The risk score is computed automatically
    from known_elders / young_practitioners / practice_frequency."""
    score, band, _ = calculate_risk_score(
        payload.known_elders, payload.young_practitioners, payload.practice_frequency
    )
    record = HeritageRecord(
        owner_id=current_user.id,
        title=payload.title,
        category=payload.category,
        description=payload.description or "",
        location_name=payload.location_name or "",
        latitude=payload.latitude,
        longitude=payload.longitude,
        known_elders=payload.known_elders or 0,
        young_practitioners=payload.young_practitioners or 0,
        practice_frequency=payload.practice_frequency or "unknown",
        risk_score=score,
        risk_band=band,
        status="at_risk" if band == "red" else "draft",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record.owner_name = current_user.full_name
    return record


@router.get("", response_model=List[HeritageOut])
def list_heritage(db: Session = Depends(get_db)) -> List[HeritageRecord]:
    """List every heritage record, most recently created first."""
    records = db.query(HeritageRecord).order_by(HeritageRecord.created_at.desc()).all()
    return _attach_owner_names(db, records)


@router.get("/{record_id}", response_model=HeritageOut)
def get_heritage(record_id: str, db: Session = Depends(get_db)) -> HeritageRecord:
    """Fetch a single heritage record by id."""
    record = _get_record_or_404(db, record_id)
    return _attach_owner_name(db, record)


@router.patch("/{record_id}", response_model=HeritageOut)
def update_heritage(
    record_id: str,
    payload: HeritageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HeritageRecord:
    """Partially update a heritage record. If any risk-related field changes,
    the risk score is recomputed automatically."""
    record = _get_record_or_404(db, record_id)
    _require_owner(record, current_user)

    updated_fields = payload.model_dump(exclude_unset=True)
    for field, value in updated_fields.items():
        setattr(record, field, value)

    risk_inputs = ("known_elders", "young_practitioners", "practice_frequency")
    if any(field in updated_fields for field in risk_inputs):
        score, band, _ = calculate_risk_score(
            record.known_elders, record.young_practitioners, record.practice_frequency
        )
        record.risk_score = score
        record.risk_band = band

    db.commit()
    db.refresh(record)
    record.owner_name = current_user.full_name
    return record


@router.delete("/{record_id}")
def delete_heritage(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a heritage record."""
    record = _get_record_or_404(db, record_id)
    _require_owner(record, current_user)
    db.delete(record)
    db.commit()
    return {"deleted": True, "id": record_id}


@router.post("/{record_id}/media", response_model=HeritageOut)
def upload_media(
    record_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HeritageRecord:
    """Attach a photo, video, or audio file to a heritage record."""
    record = _get_record_or_404(db, record_id)
    _require_owner(record, current_user)

    file_extension = os.path.splitext(file.filename or "")[1]
    safe_filename = f"{uuid.uuid4().hex}{file_extension}"
    destination_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_urls = list(record.media_urls or [])
    media_urls.append(f"/uploads/{safe_filename}")
    record.media_urls = media_urls

    db.commit()
    db.refresh(record)
    record.owner_name = current_user.full_name
    return record


@router.delete("/{record_id}/media", response_model=HeritageOut)
def remove_media(
    record_id: str,
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HeritageRecord:
    """Detach one photo/video/audio file from a record and delete it from
    disk (used when editing a record to drop previously uploaded media)."""
    record = _get_record_or_404(db, record_id)
    _require_owner(record, current_user)

    media_urls = list(record.media_urls or [])
    if url not in media_urls:
        raise HTTPException(status_code=404, detail="That media file isn't on this record")
    media_urls.remove(url)
    record.media_urls = media_urls

    file_path = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if os.path.exists(file_path):
        os.remove(file_path)

    db.commit()
    db.refresh(record)
    record.owner_name = current_user.full_name
    return record
