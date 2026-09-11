"""
Seeds the database with a demo "pilot village" dataset matching the
pitch deck's "Killer Demo" slide:
  - 3 undocumented heritage places
  - 5 oral histories / traditions
  - a mix of at-risk and healthy records

Run with:
    python seed_demo_data.py
"""
import logging

from database import Base, SessionLocal, engine
from models import HeritageRecord
from services.risk_service import calculate_risk_score

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

DEMO_RECORDS = [
    dict(
        title="Ancient Village Temple",
        category="temple",
        description="A community-documented village temple with local stories passed down for generations.",
        location_name="Demo Village, Bihar",
        latitude=25.62, longitude=85.10,
        known_elders=6, young_practitioners=3, practice_frequency="weekly",
    ),
    dict(
        title="Old Haveli",
        category="haveli",
        description="An old local structure documented through community evidence, currently unoccupied.",
        location_name="Heritage Village, Bihar",
        latitude=25.58, longitude=85.16,
        known_elders=3, young_practitioners=1, practice_frequency="rare",
    ),
    dict(
        title="Sacred Banyan Tree",
        category="sacred_tree",
        description="A culturally important sacred site preserved through local memory and seasonal rituals.",
        location_name="Demo Village, Bihar",
        latitude=25.55, longitude=85.12,
        known_elders=4, young_practitioners=1, practice_frequency="monthly",
    ),
    dict(
        title="Traditional Folk Performance",
        category="ritual",
        description="A living tradition with declining participation among young people in the region.",
        location_name="Cultural Village, Bihar",
        latitude=25.60, longitude=85.20,
        known_elders=3, young_practitioners=0, practice_frequency="declining",
    ),
]


def main() -> None:
    db = SessionLocal()
    try:
        existing_count = db.query(HeritageRecord).count()
        if existing_count > 0:
            logger.info(
                "Database already has %d records. Skipping seed to avoid duplicates.",
                existing_count,
            )
            return

        for data in DEMO_RECORDS:
            score, band, _ = calculate_risk_score(
                data["known_elders"], data["young_practitioners"], data["practice_frequency"]
            )
            record = HeritageRecord(
                **data,
                risk_score=score,
                risk_band=band,
                status="at_risk" if band == "red" else "draft",
                verification_count=0,
            )
            db.add(record)

        db.commit()
        logger.info("Seeded %d demo heritage records.", len(DEMO_RECORDS))
    finally:
        db.close()


if __name__ == "__main__":
    main()
