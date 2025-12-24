from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime


class Role(str, Enum):
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"


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

    owner_id: int = Field(nullable=False)
    org_name: Optional[str] = None

    doc_type: str = Field(nullable=False)
    doc_number: str = Field(nullable=False)

    file_url: str = Field(nullable=False)
    hash: str = Field(nullable=False)

    issued_at: datetime = Field(nullable=False)

    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )
