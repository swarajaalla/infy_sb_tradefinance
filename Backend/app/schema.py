# app/schema.py
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Any
from decimal import Decimal
from pydantic import BaseModel, EmailStr
from app.models import TradeStatus  

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
    user: UserResponse



# -------------------------
# Trade Status Enum for Schemas
# -------------------------
class TradeStatusEnum(str, Enum):
    INITIATED = TradeStatus.INITIATED.value
    SELLER_CONFIRMED = TradeStatus.SELLER_CONFIRMED.value
    DOCUMENTS_UPLOADED = TradeStatus.DOCUMENTS_UPLOADED.value
    BANK_REVIEWING = TradeStatus.BANK_REVIEWING.value
    BANK_APPROVED = TradeStatus.BANK_APPROVED.value
    PAYMENT_RELEASED = TradeStatus.PAYMENT_RELEASED.value
    COMPLETED = TradeStatus.COMPLETED.value
    DISPUTED = TradeStatus.DISPUTED.value
    CANCELLED = TradeStatus.CANCELLED.value


# -------------------------
# Trade Create Schema
# -------------------------
class TradeCreate(BaseModel):
    seller_email: EmailStr
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3, default="USD")
    description: Optional[str] = None
    product_details: Optional[Dict[str, Any]] = None
    payment_terms: Optional[str] = None


# -------------------------
# Trade Response Schema
# -------------------------
class TradeResponse(BaseModel):
    id: int
    buyer_email: EmailStr
    seller_email: EmailStr
    issuing_bank_id: Optional[int]
    amount: Decimal
    currency: str
    status: TradeStatusEnum
    description: Optional[str]
    product_details: Optional[Dict[str, Any]]
    payment_terms: Optional[str]

    initiated_at: datetime
    confirmed_at: Optional[datetime]
    documents_uploaded_at: Optional[datetime]
    bank_review_started_at: Optional[datetime]
    bank_approved_at: Optional[datetime]
    payment_released_at: Optional[datetime]
    completed_at: Optional[datetime]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # allows reading directly from SQLAlchemy models


# -------------------------
# Workflow Status Update Schema
# -------------------------
class WorkflowStatusUpdate(BaseModel):
    action: TradeStatusEnum
    notes: Optional[str] = None


# -------------------------
# Assign Bank Request Schema
# -------------------------
class AssignBankRequest(BaseModel):
    trade_id: int
    bank_email: EmailStr

# -------------------------
# Document Schemas
# -------------------------
class DocumentCreate(BaseModel):
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    issued_at: Optional[datetime] = None
    trade_id: Optional[int] = None


class DocumentResponse(BaseModel):
    id: int
    owner_id: int
    trade_id: Optional[int]
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    issued_at: Optional[datetime]
    created_at: datetime
    org_name: Optional[str]

    class Config:
        from_attributes = True


class UpdateMode(str, Enum):
    overwrite = "overwrite"
    append = "append"

# -------------------------
# Ledger Schemas
# -------------------------
class LedgerCreate(BaseModel):
    document_id: Optional[int] = None
    trade_id: Optional[int] = None
    action: str
    meta_data: Optional[Dict] = None


class LedgerResponse(BaseModel):
    id: int
    document_id: Optional[int]
    trade_id: Optional[int]
    action: str
    actor_id: int
    meta_data: Optional[Dict]
    created_at: datetime

    class Config:
        from_attributes = True



class IntegrityCheckResponse(BaseModel):
    id: int
    check_type: str
    status: str
    started_by: int
    findings: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class IntegritySummary(BaseModel):
    total_checks: int
    checks_by_status: Dict[str, int]
    checks_by_type: Dict[str, int]
    last_check_time: Optional[datetime]
    last_check_status: Optional[str]
    average_findings: float
    time_period_days: int
    last_check_errors: Optional[int] = 0
    last_check_warnings: Optional[int] = 0
    last_check_type: Optional[str] = None

# In Backend/app/schema.py, update the AlertResponse schema:
class AlertResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    alert_type: str
    source: str
    alert_data: Optional[Dict[str, Any]]  # CHANGED from metadata to alert_data
    acknowledged: bool
    acknowledged_by: Optional[int]
    acknowledged_at: Optional[datetime]
    resolved: bool
    resolved_by: Optional[int]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class RiskScoreResponse(BaseModel):
    user_id: int
    score: float  # Changed from risk_score to score
    risk_level: str
    factors: Dict[str, Any]
    last_calculated: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class RiskRecalculateRequest(BaseModel):
    force: bool = False

class RiskRecalculateAllRequest(BaseModel):
    batch_size: int = 100


