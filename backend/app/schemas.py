# app/schemas.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import Role

# Support both pydantic v1 and v2:
# - v2 uses `model_config = ConfigDict(from_attributes=True)`
# - v1 uses `class Config: orm_mode = True`
try:
    # pydantic v2
    from pydantic import ConfigDict

    def _make_config():
        return {"model_config": ConfigDict(from_attributes=True)}
except Exception:
    # fallback to pydantic v1 style
    def _make_config():
        return {"Config": type("Config", (), {"orm_mode": True})}


# ---------- USER SCHEMAS ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role
    org_name: Optional[str] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Role
    org_name: Optional[str]
    created_at: datetime


# attach pydantic config in a way that works for v1 and v2
for k, v in _make_config().items():
    setattr(UserRead, k, v)


# ---------- AUTH SCHEMAS ----------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ---------- DOCUMENT SCHEMAS ----------

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    doc_type: Optional[str] = None
    doc_number: Optional[str] = None
    file_url: Optional[str] = None
    hash: Optional[str] = None


class DocumentRead(DocumentCreate):
    id: int
    owner_id: int
    org_name: Optional[str]
    created_at: datetime
    updated_at: datetime


for k, v in _make_config().items():
    setattr(DocumentRead, k, v)
