from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from .models import UserRole, TradeStatus, DocumentType  # Interconnect with Enums

# ---------- AUTH SCHEMAS ----------
class UserLogin(BaseModel):
    """Schema for authentication requests."""
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    """Schema for registering new network identities."""
    name: str
    email: EmailStr
    password: str
    role: UserRole  # Forces selection of admin, buyer, seller, or bank
    org_id: int

class UserResponse(BaseModel):
    """Metadata returned after login or registration."""
    id: int
    name: str
    email: EmailStr
    role: UserRole
    org_id: int

    class Config:
        from_attributes = True

# ---------- TRACE SYSTEM SCHEMAS ----------
class TradeStatusHistoryBase(BaseModel):
    """Immutable record of trade lifecycle movements."""
    status: str
    remarks: Optional[str] = None
    changed_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ---------- BILLING & PAYMENT SCHEMAS ----------
class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    amount: Decimal
    due_date: Optional[datetime]
    is_paid: int

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: int
    transaction_hash: str
    amount_paid: Decimal
    payment_date: datetime

    class Config:
        from_attributes = True

# ---------- TRADE SCHEMAS (The Core) ----------
class TradeCreate(BaseModel):
    """Schema for a Buyer to initiate a new trade asset."""
    description: str
    amount: Decimal
    currency: str = "INR"
    seller_id: int
    bank_id: Optional[int] = None

class TradeResponse(BaseModel):
    """Comprehensive trade data for role-based dashboards."""
    id: int
    trade_number: str
    description: str
    amount: Decimal
    currency: str
    status: TradeStatus
    buyer_id: int
    seller_id: int
    bank_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    status_history: List[TradeStatusHistoryBase] = []
    invoices: List[InvoiceResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True

# ---------- INTEGRITY & SECURITY SCHEMAS ----------

class IntegrityRecord(BaseModel):
    """Powers the 'Integrity Status' grid in the Admin Dashboard."""
    id: str 
    doc_type: DocumentType
    hash_type: str = "SHA256"
    status: str # PASS, FAIL, or PENDING
    expected_hash: str
    computed_hash: str

    class Config:
        from_attributes = True

class AlertSummary(BaseModel):
    """Powers the red 'Unacknowledged Alerts' banner."""
    count: int
    message: str
    severity: str 

class AuditLogResponse(BaseModel):
    """Audit trail for Admin security oversight."""
    id: int
    action: str
    actor_id: Optional[int]
    details: Optional[dict]
    timestamp: datetime

    class Config:
        from_attributes = True