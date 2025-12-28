import jwt
import os
from fastapi import HTTPException, Depends
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

# Expect header: Authorization: Bearer <token>
oauth2_scheme = APIKeyHeader(name="Authorization")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Extracts user from JWT token in Authorization header.
    Token format required:
        Authorization: Bearer <token>
    """

    # Must start with Bearer
    if not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format. Use: Bearer <token>")

    # Remove "Bearer "
    token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")

    # Fetch user from DB
    user = db.query(models.User).filter(models.User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
