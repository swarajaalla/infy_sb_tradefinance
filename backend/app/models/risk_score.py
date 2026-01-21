from sqlalchemy import Column, Integer, Numeric, String, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)

    score = Column(Numeric(5, 2), nullable=False)
    level = Column(String(10), nullable=False)

    breakdown = Column(JSON, nullable=False)

    calculated_at = Column(DateTime, server_default=func.now())
