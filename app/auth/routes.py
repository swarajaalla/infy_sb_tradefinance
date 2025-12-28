from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
from .utils import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["Auth"])

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- SIGNUP ----------
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # check if username or email already exists
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()

    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    hashed = hash_password(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed,
        role=user.role,
        org_name=user.org_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}

# ---------- LOGIN ----------
# Use OAuth2PasswordRequestForm so Swagger's "Authorize" works with tokenUrl="/auth/login"
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # find user by username
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or password")

    # verify password
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or password")

    # create token (payload will include "sub": username; you can add role/org if you want)
    token = create_token({"sub": user.username, "role": user.role, "org_name": user.org_name})

    return {"access_token": token, "token_type": "bearer"}

# ---------- PROTECTED: get current user ----------
# This endpoint expects your dependencies.get_current_user to decode JWT and return DB user
from app.auth.dependencies import get_current_user

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user = Depends(get_current_user)):
    # current_user should be a SQLAlchemy user instance returned by get_current_user
    return current_user
