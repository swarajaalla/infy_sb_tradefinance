from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..database import get_session
from ..models import User, Role
from ..schemas import UserRead
from ..auth import get_current_user
from .. import crud

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    """
    Return the currently logged-in user.
    """
    return current_user


@router.get("/", response_model=list[UserRead])
def list_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    role_val = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    if role_val not in (Role.admin.value, Role.auditor.value):
        raise HTTPException(
            status_code=403,
            detail="Admin or Auditor access required",
        )

    return crud.list_users(session)


