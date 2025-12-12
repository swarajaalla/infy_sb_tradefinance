from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    org_name: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    org_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse   # 👈 REQUIRED


class DocType(Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"


class DocumentCreate(BaseModel):
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime | None = None


class DocumentResponse(BaseModel):
    id: int
    owner_id: int
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    org_name: str
    issued_at: datetime | None
    created_at: datetime

    class Config:
        orm_mode = True
