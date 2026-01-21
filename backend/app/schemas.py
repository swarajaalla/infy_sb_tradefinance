from datetime import datetime
from typing import Optional,List
from pydantic import BaseModel, EmailStr
from .models import Role,TradeStatus,IntegrityStatus

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
    message: str
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


class LedgerCreate(BaseModel):
    document_id: int
    event_type: str
    description: Optional[str] = None
    hash_before: Optional[str] = None
    hash_after: Optional[str] = None


class LedgerRead(BaseModel):
    id: int
    document_id: int
    event_type: str
    description: Optional[str]
    hash_before: Optional[str]
    hash_after: Optional[str]
    timestamp: datetime


for k, v in _make_config().items():
    setattr(LedgerRead, k, v)

# ==================================================
# TRADE SCHEMAS
# ==================================================

class UserMini(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Role
    org_name: Optional[str] = None
    created_at: datetime


class TradeStatusHistory(BaseModel):
    id: int
    status: str
    changed_by_id: int
    remarks: Optional[str] = None
    created_at: datetime


class TradeCreate(BaseModel):
    seller_email: EmailStr
    description: str
    amount: float
    currency: str


class TradeRead(BaseModel):
    id: int
    trade_number: str

    buyer_id: int
    seller_id: int
    bank_id: Optional[int] = None

    description: str
    amount: float
    currency: str
    status: TradeStatus

    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    buyer: UserMini
    seller: UserMini
    bank: Optional[UserMini] = None

    status_history: list[TradeStatusHistory]


class TradeStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None


class AssignBankRequest(BaseModel):
    bank_email: EmailStr

# ==================================================
# INTEGRITY SCHEMAS
# ==================================================

# Request to run integrity check
class IntegrityRunRequest(BaseModel):
    document_ids: Optional[List[int]] = None
    # If None -> run for all documents
    # If list -> run only for those documents


# Read model for a single integrity check record
class IntegrityCheckRead(BaseModel):
    id: int
    document_id: int
    stored_hash: Optional[str]
    computed_hash: Optional[str]
    status: IntegrityStatus
    check_type: str
    created_at: datetime


# Summary for dashboard
class IntegritySummaryRead(BaseModel):
    total: int
    passed: int
    failed: int
    pending: int


# Read model for alert
class IntegrityAlertRead(BaseModel):
    id: int
    document_id: int
    integrity_check_id: int
    message: str
    acknowledged: bool
    acknowledged_by: Optional[int]
    created_at: datetime


# Request to acknowledge an alert
class IntegrityAlertAcknowledge(BaseModel):
    remarks: Optional[str] = None

# ==================================================
# RISK SCHEMAS
# ==================================================

class RiskScoreBase(BaseModel):
    user_id: int
    score: float
    rationale: str | None = None


class RiskScoreOut(RiskScoreBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True
