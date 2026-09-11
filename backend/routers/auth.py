"""
Account endpoints: register, login, and "who am I" — the basis for gating
heritage-record writes to logged-in users and their own content.
"""
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from config import UPLOAD_DIR
from database import get_db
from models import User
from schemas import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register", response_model=UserOut)
def register(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(..., min_length=6),
    mobile: str = Form(""),
    address: str = Form(""),
    state: str = Form(""),
    district: str = Form(""),
    craft_category: str = Form(""),
    years_experience: str = Form(""),
    about_craft: str = Form(""),
    profile_picture: Optional[UploadFile] = File(None),
    craft_photos: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
) -> User:
    """Create an account. Does not log the user in — matches the flow where
    the user registers, then signs in separately with email + password."""
    normalized_email = email.strip().lower()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    def save_upload(upload: UploadFile) -> str:
        file_extension = os.path.splitext(upload.filename)[1]
        safe_filename = f"{uuid.uuid4().hex}{file_extension}"
        destination_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)
        return f"/uploads/{safe_filename}"

    profile_picture_url = None
    if profile_picture is not None and profile_picture.filename:
        profile_picture_url = save_upload(profile_picture)

    craft_photo_urls = [save_upload(photo) for photo in craft_photos if photo.filename]

    user = User(
        full_name=full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(password),
        mobile=mobile.strip(),
        address=address.strip(),
        state=state.strip(),
        district=district.strip(),
        profile_picture_url=profile_picture_url,
        craft_category=craft_category.strip(),
        years_experience=years_experience.strip(),
        about_craft=about_craft.strip(),
        craft_photo_urls=craft_photo_urls,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    """Lets the frontend restore a session on page load from a stored token."""
    return current_user
