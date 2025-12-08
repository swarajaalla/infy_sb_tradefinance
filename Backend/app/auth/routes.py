from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import get_db
from app.models import User
from app.schema import UserCreate, LoginRequest, TokenResponse
from app.auth.jwt_handler import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register_user(data: UserCreate, db: Session = Depends(get_db)):
    hashed = pwd_context.hash(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed,
        role=data.role,
        org_name=data.org_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not pwd_context.verify(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    payload = {"user_id": user.id, "role": user.role.value}

    return TokenResponse(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload)
    )
