from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy import LargeBinary



class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    doc_type = Column(String(50), nullable=False)
    doc_number = Column(String(100), nullable=False)
    issued_at = Column(DateTime, nullable=False)

    file_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)


    uploaded_by = Column(Integer, ForeignKey("users.id"))
    org_name = Column(String(100), nullable=False)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    file_data = Column(LargeBinary)
