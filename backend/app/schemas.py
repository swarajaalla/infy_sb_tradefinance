from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from .models import Role

try:
    from pydantic import ConfigDict
    def _make_config():
        return {"model_config": ConfigDict(from_attributes=True)}
except Exception:
    def _make_config():
        return {"Config": type("Config", (), {"orm_mode": True})}


# ---------- USER ----------
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


for k, v in _make_config().items():
    setattr(UserRead, k, v)


# ---------- AUTH ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ---------- DOCUMENT ----------
class DocumentCreate(BaseModel):
    doc_type: str
    doc_number: str
    issued_at: datetime


class DocumentRead(BaseModel):
    id: int
    owner_id: int
    org_name: Optional[str]
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime


for k, v in _make_config().items():
    setattr(DocumentRead, k, v)
