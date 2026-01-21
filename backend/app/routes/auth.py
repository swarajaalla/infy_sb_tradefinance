from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from app.database import SessionLocal
from app.models.user import User
from app.auth.jwt import create_access_token
from fastapi import Body

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body(...),
    org_name: str = Body(...),
    db: Session = Depends(get_db)
):
    try:
        hashed = pwd_context.hash(password)

        user = User(
            name=name,
            email=email,
            password=hashed,
            role=role,
            org_name=org_name
        )

        db.add(user)
        db.commit()

        return {"msg": "User registered successfully"}

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")


@router.post("/login")
def login(
    email: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()

    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "org_name": user.org_name
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
