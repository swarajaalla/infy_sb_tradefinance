from datetime import datetime
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field,Relationship
from sqlalchemy import Column, DateTime



class Role(str, Enum):
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"

class DocumentType(str, Enum):
    invoice = "INVOICE"
    bl = "BL"
    loc = "LOC"
    insurance = "INSURANCE"
    po = "PO"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    hashed_password: str
    role: str
    refresh_token: Optional[str] = Field(default=None, nullable=True)
    org_name: Optional[str] = None
    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int
    org_name: Optional[str] = None
    doc_type: str
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )


class Ledger(SQLModel, table=True):
    __tablename__ = "ledger"

    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int

    actor_id: int
    org_name: str

    event_type: str
    description: Optional[str] = None
    hash_before: Optional[str] = None
    hash_after: Optional[str] = None

    timestamp: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False,
                         default=lambda: datetime.now(timezone.utc))
    )

# ==================================================
# TRADE STATUS ENUM
# ==================================================
class TradeStatus(str, Enum):
    INITIATED = "INITIATED"
    SELLER_CONFIRMED = "SELLER_CONFIRMED"
    DOCUMENTS_UPLOADED = "DOCUMENTS_UPLOADED"
    BANK_ASSIGNED = "BANK_ASSIGNED"
    BANK_REVIEWING = "BANK_REVIEWING"
    BANK_APPROVED = "BANK_APPROVED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ==================================================
# TRADE MODEL
# ==================================================
class Trade(SQLModel, table=True):
    __tablename__ = "trade"

    id: Optional[int] = Field(default=None, primary_key=True)

    trade_number: str = Field(nullable=False, index=True)

    buyer_id: int = Field(foreign_key="users.id")
    seller_id: int = Field(foreign_key="users.id")
    bank_id: Optional[int] = Field(default=None, foreign_key="users.id")

    description: str
    amount: float
    currency: str

    status: TradeStatus = Field(nullable=False, default=TradeStatus.INITIATED)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)

    # ---- Optional relationships (SAFE) ----
    buyer: Optional["User"] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Trade.buyer_id]"})
    seller: Optional["User"] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Trade.seller_id]"})
    bank: Optional["User"] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Trade.bank_id]"})

# ==================================================
# INTEGRITY CHECK MODELS
# ==================================================
class IntegrityStatus(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    PENDING = "PENDING"


class IntegrityCheck(SQLModel, table=True):
    __tablename__ = "integrity_checks"

    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int

    stored_hash: Optional[str]
    computed_hash: Optional[str]

    status: IntegrityStatus
    check_type: str = "SHA256"

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False,
                         default=lambda: datetime.now(timezone.utc))
    )


class IntegrityAlert(SQLModel, table=True):
    __tablename__ = "integrity_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int
    integrity_check_id: int

    message: str
    acknowledged: bool = Field(default=False)
    acknowledged_by: Optional[int] = None

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False,
                         default=lambda: datetime.now(timezone.utc))
    )
