from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class TradeStatusHistory(Base):
    __tablename__ = "trade_status_history"

    id = Column(Integer, primary_key=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=False)
    status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    remarks = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
