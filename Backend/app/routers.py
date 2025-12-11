# app/routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schema import UserResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# --------------------------------------------
# GET /users/me → current logged user
# --------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# --------------------------------------------
# GET /users → ADMIN ONLY
# --------------------------------------------
@router.get("/", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Support both ENUM and STRING roles
    role_value = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )

    if role_value != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    return db.query(User).all()
