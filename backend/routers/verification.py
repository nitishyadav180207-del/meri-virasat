"""
Community verification endpoints — confirmations, elder interviews, evidence.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import VERIFICATION_THRESHOLD
from database import get_db
from models import HeritageRecord
from schemas import VerifyRequest, HeritageOut

router = APIRouter(prefix="/heritage", tags=["verification"])


@router.post("/{record_id}/verify", response_model=HeritageOut)
def verify_heritage(
    record_id: str, payload: VerifyRequest, db: Session = Depends(get_db)
) -> HeritageRecord:
    """Record a community confirmation (and optional evidence note) for a record.

    Once verification_count reaches VERIFICATION_THRESHOLD, the record's
    status flips to "verified" — unless it's already flagged "at_risk", since
    community confirmation doesn't reduce the actual risk of disappearing.
    """
    record = db.query(HeritageRecord).filter(HeritageRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Heritage record not found")

    record.verification_count = (record.verification_count or 0) + 1

    notes = list(record.evidence_notes or [])
    if payload.note:
        notes.append(payload.note)
    record.evidence_notes = notes

    if record.verification_count >= VERIFICATION_THRESHOLD and record.status != "at_risk":
        record.status = "verified"

    db.commit()
    db.refresh(record)
    return record
