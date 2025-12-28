from datetime import datetime
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
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

    document_id: int = Field(nullable=False)
    event_type: str = Field(nullable=False)  # CREATED, UPLOADED, VERIFIED, ACCESSED, MODIFIED
    description: Optional[str] = None

    hash_before: Optional[str] = None
    hash_after: Optional[str] = None

    timestamp: datetime = Field(
    sa_column=Column(DateTime(timezone=True), nullable=False,
                     default=lambda: datetime.now(timezone.utc))
    )
