from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, 
    ForeignKey, Numeric, JSON, Boolean
)
from sqlalchemy.orm import relationship
from .database import Base

# =========================
# 1. ENUMS (Must be defined first)
# =========================

class UserRole(str, PyEnum):
    bank = "bank"
    buyer = "buyer"      # Explicitly for procurement dashboards
    seller = "seller"    # Explicitly for shipping dashboards
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"

class DocumentType(str, PyEnum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"

class LedgerAction(str, PyEnum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"
    DOWNLOADED = "DOWNLOADED"

class TradeStatus(str, PyEnum):
    """The TradeStatus class required for schemas.py"""
    INITIATED = "INITIATED"
    SELLER_CONFIRMED = "SELLER_CONFIRMED"
    DOCUMENTS_UPLOADED = "DOCUMENTS_UPLOADED"
    BANK_REVIEWING = "BANK_REVIEWING"
    BANK_APPROVED = "BANK_APPROVED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"

# =========================
# 2. TABLES
# =========================

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # String references prevent initialization errors
    users = relationship("User", back_populates="organization")
    documents = relationship("Document", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(300), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.buyer) # Matches your registration format
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    documents = relationship("Document", back_populates="owner")
    risk_scores = relationship("RiskScore", back_populates="user")
    ledger_actions = relationship("LedgerEntry", back_populates="actor")
    
    # Relationships for Trade Participants using string foreign keys
    trades_as_buyer = relationship("Trade", foreign_keys="[Trade.buyer_id]", back_populates="buyer")
    trades_as_seller = relationship("Trade", foreign_keys="[Trade.seller_id]", back_populates="seller")

class Trade(Base):
    """The central Trade object for Dashboards and Tracking."""
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    trade_number = Column(String(50), unique=True, nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bank_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(String(255))
    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(Enum(TradeStatus), default=TradeStatus.INITIATED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Participant Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="trades_as_buyer")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="trades_as_seller")
    bank = relationship("User", foreign_keys=[bank_id])
    
    documents = relationship("Document", back_populates="trade")
    invoices = relationship("Invoice", back_populates="trade")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, nullable=False)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    
    trade = relationship("Trade", back_populates="invoices")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True) 
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    doc_type = Column(Enum(DocumentType), nullable=False)
    hash = Column(String(64), nullable=False) # For blockchain verification
    file_url = Column(String(300), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trade = relationship("Trade", back_populates="documents")
    owner = relationship("User", back_populates="documents")
    organization = relationship("Organization", back_populates="documents")
    ledger_entries = relationship("LedgerEntry", back_populates="document")

class LedgerEntry(Base):
    """Immutable Audit Trail for documents"""
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    action = Column(Enum(LedgerAction), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ledger_entries")
    actor = relationship("User", back_populates="ledger_actions")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Numeric(5, 2), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="risk_scores")