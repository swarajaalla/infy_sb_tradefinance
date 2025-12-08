from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP
from datetime import datetime
from .database import Base
import enum

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
