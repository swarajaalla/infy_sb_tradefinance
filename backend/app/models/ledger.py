from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(Integer, ForeignKey("documents.id"))
    event_type = Column(String(50), nullable=False)
    trade_id = Column(Integer, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"))
    role = Column(String(30), nullable=False)

    previous_hash = Column(String(64))
    current_hash = Column(String(64))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
