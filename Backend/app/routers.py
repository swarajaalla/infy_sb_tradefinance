# app/routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User, UserRole
from app.schema import UserCreate, UserResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --------------------------------------------
# Helper: Admin check
# --------------------------------------------
def admin_only(current_user: User):
    role_value = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )
    if role_value != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")


# --------------------------------------------
# GET /users/me → current user
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
    current_user: User = Depends(get_current_user),
):
    admin_only(current_user)
    return db.query(User).all()


# --------------------------------------------
# POST /users → ADMIN ONLY (Add User)
# --------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_only(current_user)

    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = pwd_context.hash(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        role=UserRole(data.role),
        org_name=data.org_name,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# --------------------------------------------
# DELETE /users/{user_id} → ADMIN ONLY
# --------------------------------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_only(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin deleting himself
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete self")

    db.delete(user)
    db.commit()
