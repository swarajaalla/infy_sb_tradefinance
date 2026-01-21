from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["Users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/me")
def read_me(user = Depends(get_current_user)):
    return {
        "id": user.get("sub"),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "org_name": user.get("org_name")
    }

@router.get("/")
def list_users(
    user = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    return db.query(User).all()
