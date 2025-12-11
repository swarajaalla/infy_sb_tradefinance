from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, func
from datetime import datetime
from .database import Base
import enum
from sqlalchemy.orm import relationship

class Role(enum.Enum):
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    org_name = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class DocumentType(enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doc_type = Column(Enum(DocumentType), nullable=False)
    doc_number = Column(String, nullable=False, unique=True)
    file_url = Column(String, nullable=False)
    hash = Column(String, nullable=False)
    issued_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    owner = relationship("User")
