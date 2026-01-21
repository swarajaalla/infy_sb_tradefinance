from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CreateTradeSchema(BaseModel):
    seller_email: EmailStr
    description: str
    amount: float
    currency: str


class UpdateTradeStatusSchema(BaseModel):
    status: str
    remarks: Optional[str] = None


class TradeStatusHistorySchema(BaseModel):
    status: str
    remarks: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
