# app/models.py
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, ForeignKey,
    Numeric, JSON,Text,Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from sqlalchemy import Enum as SQLEnum
from app.database import Base


# -------------------------
# User Model
# -------------------------
class UserRole(enum.Enum):
    corporate = "corporate"
    bank = "bank"
    admin = "admin"
    auditor = "auditor"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    org_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------
# Trade Workflow Status
# -------------------------
class TradeStatus(enum.Enum):
    INITIATED = "INITIATED"
    SELLER_CONFIRMED = "SELLER_CONFIRMED"
    DOCUMENTS_UPLOADED = "DOCUMENTS_UPLOADED"
    BANK_REVIEWING = "BANK_REVIEWING"
    BANK_APPROVED = "BANK_APPROVED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"


# -------------------------
# Trade Model
# -------------------------
class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)

    buyer_email = Column(String, nullable=False)
    seller_email = Column(String, nullable=False)

    issuing_bank_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), default="USD")

    # Use SQLAlchemy Enum for status
    status = Column(Enum(TradeStatus, name="trade_status"), default=TradeStatus.INITIATED, nullable=False)

    description = Column(String, nullable=True)
    product_details = Column(JSON, nullable=True)
    payment_terms = Column(String, nullable=True)

    # Timeline
    initiated_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    documents_uploaded_at = Column(DateTime, nullable=True)
    bank_review_started_at = Column(DateTime, nullable=True)
    bank_approved_at = Column(DateTime, nullable=True)
    payment_released_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    issuing_bank = relationship("User", foreign_keys=[issuing_bank_id])
    documents = relationship("Document", back_populates="trade")
    ledger_entries = relationship("LedgerEntry", back_populates="trade")



# -------------------------
# Document Model
# -------------------------
class DocumentType(enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PACKING_LIST = "PACKING_LIST"  # Add this
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"
    CONTRACT = "CONTRACT"
    PAYMENT_PROOF = "PAYMENT_PROOF"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)

    doc_type = Column(Enum(DocumentType), nullable=False)
    doc_number = Column(String, unique=True, nullable=False)
    file_url = Column(String, nullable=True)
    hash = Column(String, unique=True, nullable=False)

    issued_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    trade = relationship("Trade", back_populates="documents")


# -------------------------
# Ledger Model
# -------------------------
class LedgerAction(enum.Enum):
    INITIATED = "INITIATED"
    SELLER_CONFIRMED = "SELLER_CONFIRMED"
    DOCUMENTS_UPLOADED = "DOCUMENTS_UPLOADED"
    BANK_REVIEWING = "BANK_REVIEWING"
    BANK_APPROVED = "BANK_APPROVED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"
    
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)

    action = Column(SQLEnum(LedgerAction, name="ledgeraction"), nullable=False)  # ✅ Use SQLAlchemy Enum
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User")
    document = relationship("Document")
    trade = relationship("Trade", back_populates="ledger_entries")



# Update your models.py - Replace the Alert and IntegrityCheck classes with this:

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False)  # low, medium, high, critical
    alert_type = Column(String(100), nullable=False)  # integrity_error, system, security, etc.
    source = Column(String(255))  # e.g., "integrity_check:123", "system", "manual"
    alert_data = Column(JSON, nullable=True)  # CHANGED: renamed from metadata to alert_data
    
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    acknowledged_user = relationship("User", foreign_keys=[acknowledged_by])
    resolved_user = relationship("User", foreign_keys=[resolved_by])


class IntegrityCheck(Base):
    __tablename__ = "integrity_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    check_type = Column(String(100), nullable=False)  # document_hash, trade_consistency, etc.
    status = Column(String(50), nullable=False)  # running, completed, failed
    started_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    findings = Column(JSON, nullable=True)  # Results of the check
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    started_by_user = relationship("User", foreign_keys=[started_by])