from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, Enum as SAEnum


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
    role: str  # better: Role enum, but ensure consistent usage
    refresh_token: Optional[str] = Field(default=None, nullable=True)
    org_name: Optional[str] = None
    created_at: datetime = Field(sa_column=Column(DateTime, nullable=False, default=datetime.utcnow))

class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: Optional[int] = Field(default=None, primary_key=True)

    # required fields
    title: str = Field(nullable=False)
    description: Optional[str] = None
    doc_type: Optional[str] = None
    doc_number: Optional[str] = None
    file_url: Optional[str] = None
    hash: Optional[str] = None

    owner_id: int = Field(nullable=False)   # link to users.id
    org_name: Optional[str] = None

    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )