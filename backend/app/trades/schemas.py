from pydantic import BaseModel
from datetime import datetime

class TradeResponse(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    amount: int
    currency: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
