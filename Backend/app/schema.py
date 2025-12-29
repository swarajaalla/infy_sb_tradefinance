from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional, Dict

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

class LedgerAction(str, Enum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"

class LedgerCreate(BaseModel):
    document_id: int
    action: LedgerAction
    meta_data: Optional[Dict] = None

class LedgerResponse(BaseModel):
    id: int
    document_id: int
    action: LedgerAction
    actor_id: int
    meta_data: Optional[Dict]
    created_at: datetime

    class Config:
        orm_mode = True


class UpdateMode(str, Enum):
    overwrite = "overwrite"
    append = "append"
