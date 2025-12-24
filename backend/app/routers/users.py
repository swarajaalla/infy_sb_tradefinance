from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from ..models import User, Role
from ..schemas import UserRead
from ..auth import get_current_user
from .. import crud

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserRead])
def list_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.admin.value:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can manage and view users",
        )

    return crud.list_users(session)
