from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime

from app.database import Base


# =========================
# USER
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    role = Column(String, default="corporate")
    org_name = Column(String, nullable=True)


# =========================
# TRADE TRANSACTION
# =========================
class TradeTransaction(Base):
    __tablename__ = "trade_transactions"

    id = Column(Integer, primary_key=True, index=True)

    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bank_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    amount = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False)

    status = Column(
        SqlEnum(
            "INITIATED",
            "SELLER_CONFIRMED",
            "DOCUMENT_UPLOADED",
            "BANK_ASSIGNED",
            "BANK_REVIEWING",
            "BANK_APPROVED",
            "PAYMENT_RELEASED",
            "COMPLETED",
            name="tradestatus",
            native_enum=True,
        ),
        default="INITIATED",
        nullable=False,
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    bank = relationship("User", foreign_keys=[bank_id])

    documents = relationship(
        "Document",
        back_populates="trade",
        cascade="all, delete-orphan",
    )


# =========================
# DOCUMENT
# =========================
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    trade_id = Column(Integer, ForeignKey("trade_transactions.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    doc_type = Column(
        SqlEnum(
            "INVOICE",
            "LOC",
            "BILL_OF_LADING",
            "PO",
            name="documenttype",
            native_enum=True,
        ),
        nullable=False,
    )

    doc_number = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    hash = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    trade = relationship("TradeTransaction", back_populates="documents")


# =========================
# LEDGER ENTRY (BLOCKCHAIN LOG)
# =========================
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)

    trade_id = Column(Integer, ForeignKey("trade_transactions.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    action = Column(
        SqlEnum(
            "INITIATED",
            "SELLER_CONFIRMED",
            "DOCUMENT_UPLOADED",
            "BANK_ASSIGNED",
            "BANK_REVIEWING",
            "BANK_APPROVED",
            "PAYMENT_RELEASED",
            "COMPLETED",
            name="ledgeraction",
            native_enum=True,
        ),
        nullable=False,
    )

    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document")
    actor = relationship("User")
