from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class DocumentType(str, Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"


class DocumentCreate(BaseModel):
    doc_type: DocumentType
    doc_number: str
    issued_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    created_at: datetime

    class Config:
        from_attributes = True
