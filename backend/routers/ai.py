"""
AI endpoints: speech-to-text transcription and heritage risk scoring.
"""
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from auth import get_current_user
from config import UPLOAD_DIR
from database import get_db
from models import HeritageRecord, User
from schemas import RiskScoreRequest, RiskScoreResponse, TranscribeResponse
from services.risk_service import calculate_risk_score
from services.stt_service import transcribe_audio

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/risk-score", response_model=RiskScoreResponse)
def compute_risk_score(payload: RiskScoreRequest) -> RiskScoreResponse:
    """Compute a heritage risk score without creating or modifying a record.

    Useful for previewing the score live in a form before submitting it.
    """
    score, band, explanation = calculate_risk_score(
        payload.known_elders, payload.young_practitioners, payload.practice_frequency
    )
    return RiskScoreResponse(risk_score=score, risk_band=band, explanation=explanation)


@router.post("/transcribe/{record_id}", response_model=TranscribeResponse)
def transcribe_and_save(
    record_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TranscribeResponse:
    """Transcribe an uploaded audio file with Whisper, save it as playable
    media on the record (like a photo/video upload), and append the
    transcript text to the record's transcript.

    Returns a 503 (rather than crashing) if openai-whisper isn't installed,
    so the rest of the app keeps working without it.
    """
    record = db.query(HeritageRecord).filter(HeritageRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Heritage record not found")
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own records")

    file_extension = os.path.splitext(file.filename or "")[1] or ".wav"
    safe_filename = f"{uuid.uuid4().hex}{file_extension}"
    destination_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        transcript_text = transcribe_audio(destination_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except FileNotFoundError:
        # Whisper shells out to the `ffmpeg` binary to decode audio; this is
        # what it raises when ffmpeg isn't installed / on the system PATH.
        raise HTTPException(
            status_code=503,
            detail="ffmpeg is not installed or not on the system PATH — required to decode audio for transcription.",
        )
    except Exception as exc:
        # Any other failure (e.g. corrupt audio) must still surface as an
        # HTTPException — an unhandled exception here would skip the CORS
        # middleware and the browser would report it as an opaque
        # "Failed to fetch" instead of the real error.
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")

    media_urls = list(record.media_urls or [])
    media_urls.append(f"/uploads/{safe_filename}")
    record.media_urls = media_urls

    record.transcript = (
        f"{record.transcript}\n{transcript_text}".strip()
        if record.transcript
        else transcript_text
    )
    db.commit()

    return TranscribeResponse(transcript=transcript_text)
