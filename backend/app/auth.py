from datetime import datetime, timedelta, timezone
import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError

# --- FIXED RELATIVE IMPORTS ---
from .database import get_db
from . import models
from .schemas import UserCreate, UserResponse, UserLogin

# ======================================================
# CONFIGURATION
# ======================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "MYSECRETKEY123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "600"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ======================================================
# UTILITIES
# ======================================================

def hash_password(password: str) -> str:
    """Hashes plain text passwords for secure storage."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a login attempt against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

# ======================================================
# JWT TOKEN GENERATION
# ======================================================

def create_access_token(user_id: int, email: str, role: str, name: str) -> str:
    """Generates a JWT containing role metadata for the frontend."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": str(role),  
        "name": name,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ======================================================
# ROUTE PROTECTION (DEPENDENCY)
# ======================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """Validates the Bearer token and returns the current user node."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials missing",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# ======================================================
# ENDPOINTS
# ======================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registers a new role-based identity in the trade network."""
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered",
        )

    org = db.query(models.Organization).filter(models.Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Invalid Organization ID")

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role, 
        org_id=user.org_id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Authenticates and returns role metadata for the dashboard."""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user_role_str = db_user.role.value if hasattr(db_user.role, 'value') else str(db_user.role)

    token = create_access_token(
        user_id=db_user.id,
        email=db_user.email,
        role=user_role_str,
        name=db_user.name
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user_role_str, 
        "user_id": db_user.id,
        "name": db_user.name,
        "org_id": db_user.org_id,
        "org_name": db_user.organization.name if db_user.organization else "ChainDocs"
    }