"""
Dashboard endpoint — heritage records sorted by preservation risk, for the
"heritage at risk" view that communities, researchers and authorities use to
prioritize documentation work.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import HeritageRecord
from schemas import DashboardEntry

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/at-risk", response_model=List[DashboardEntry])
def list_at_risk_records(db: Session = Depends(get_db)) -> List[HeritageRecord]:
    """Return every heritage record, highest risk first."""
    return (
        db.query(HeritageRecord)
        .order_by(HeritageRecord.risk_score.desc())
        .all()
    )
