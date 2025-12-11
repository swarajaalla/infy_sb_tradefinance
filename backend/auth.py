from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.database import get_db

router = APIRouter()

# Create user (register)
@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = models.User(
        username=user.username,
        password=user.password,   # No hashing in milestone 1
        role=user.role,
        org_name=user.org_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

# Login (simple milestone 1 version, no JWT)
@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    record = db.query(models.User).filter(models.User.username == user.username).first()

    if not record or record.password != user.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"message": "Login successful", "username": record.username}
