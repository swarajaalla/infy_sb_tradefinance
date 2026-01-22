from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
from typing import Optional

from .database import get_db
from .models import User

# ================= CONFIGURATION =================
# These MUST match your auth/routes.py for tokens to validate
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "MYSECRETKEY123")
ALGORITHM = "HS256"

security = HTTPBearer()

# ================= DEPENDENCY =================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Extracts, decodes, and validates the JWT token.
    Interconnects the token payload with the database User object for RBAC.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    try:
        # Extract token string from the Authorization header
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # We used "sub" for user_id in the auth route token generation
        user_id: Optional[str] = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Query by ID (efficient and matches the 'sub' payload structure)
    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise credentials_exception

    # Return the user object so routes can check current_user.role
    return user