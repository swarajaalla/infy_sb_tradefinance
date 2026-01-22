from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os

# Import local configuration and models
from .database import get_db
from .models import User

# ================= CONFIG =================
# Ensure these match your config.py/auth.py exactly
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "MYSECRETKEY123")
ALGORITHM = "HS256"

# Using HTTPBearer instead of OAuth2PasswordBearer to support 
# simpler frontend token management
security = HTTPBearer()

# ================= DEPENDENCY =================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates the JWT token and returns the User object.
    This enables Role-Based Access Control (RBAC) in your routes.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid session or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    try:
        # Decode the token using your centralized secret key
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # We used user_id as 'sub' in auth.py
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Query by ID is faster than email for high-frequency dashboard requests
    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise credentials_exception

    # Returns the full User object, including the 'role' field
    return user