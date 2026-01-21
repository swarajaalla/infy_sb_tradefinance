from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import SessionLocal
from app.models.trade import Trade
from app.models.trade_status import TradeStatusHistory
from app.models.user import User
from app.auth.dependencies import require_role
from app.constants.trade_status_flow import TRADE_STATUS_FLOW

router = APIRouter(
    prefix="/api/trades",
    tags=["Trades"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================================================
# LIST TRADES
# =========================================================
@router.get("/")
def list_trades(
    user = Depends(require_role("CORPORATE", "BANK", "ADMIN")),
    db: Session = Depends(get_db)
):
    query = db.query(Trade)

    # ✅ BANK sees only assigned trades
    if user["role"] == "BANK":
        query = query.filter(Trade.bank_id == int(user["sub"]))

    return query.order_by(Trade.created_at.desc()).all()

# =========================================================
# CREATE TRADE
# =========================================================
@router.post("/", status_code=201)
def create_trade(
    seller_email: str = Body(...),
    description: str = Body(...),
    amount: float = Body(...),
    currency: str = Body(...),
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    seller = db.query(User).filter(User.email == seller_email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    trade = Trade(
        trade_number=f"TRD-{uuid.uuid4().hex[:8].upper()}",
        buyer_id=int(user["sub"]),
        seller_id=seller.id,
        description=description,
        amount=amount,
        currency=currency,
        status="INITIATED"
    )

    db.add(trade)
    db.commit()
    db.refresh(trade)

    db.add(
        TradeStatusHistory(
            trade_id=trade.id,
            status="INITIATED",
            changed_by_id=int(user["sub"]),
            remarks="Trade initiated by buyer"
        )
    )
    db.commit()

    return trade

# =========================================================
# LIST BANKS (HIDDEN FROM SWAGGER)
# =========================================================
@router.get("/banks", include_in_schema=False)
def list_banks(
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    banks = db.query(User).filter(User.role == "BANK").order_by(User.email).all()

    return [
        {"id": b.id, "email": b.email, "org_name": b.org_name}
        for b in banks
    ]

# =========================================================
# GET TRADE DETAILS
# =========================================================
@router.get("/{trade_id}")
def get_trade(
    trade_id: int,
    user = Depends(require_role("CORPORATE", "BANK", "ADMIN")),
    db: Session = Depends(get_db)
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    history = (
        db.query(TradeStatusHistory)
        .filter(TradeStatusHistory.trade_id == trade_id)
        .order_by(TradeStatusHistory.created_at)
        .all()
    )

    return {"trade": trade, "status_history": history}

# =========================================================
# UPDATE TRADE STATUS
# =========================================================
@router.patch("/{trade_id}/status")
def update_trade_status(
    trade_id: int,
    status: str = Body(..., embed=True),
    remarks: str = Body(None, embed=True),
    user = Depends(require_role("CORPORATE", "BANK", "ADMIN")),
    db: Session = Depends(get_db)
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    status = status.strip().upper()

    allowed_next = TRADE_STATUS_FLOW.get(trade.status.upper(), [])
    if status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {trade.status} to {status}"
        )

    user_id = int(user["sub"])
    role = user["role"]

    # SELLER
    if trade.seller_id == user_id:
        if status not in ["SELLER_CONFIRMED", "DOCUMENTS_UPLOADED", "COMPLETED", "REJECTED"]:
            raise HTTPException(403, "Seller not allowed")

    # BUYER
    elif trade.buyer_id == user_id:
        if status != "COMPLETED":
            raise HTTPException(403, "Buyer not allowed")

    # BANK
    elif role == "BANK":
        if status not in ["BANK_APPROVED", "PAYMENT_RELEASED", "DISPUTED"]:
            raise HTTPException(403, "Bank not allowed")

    # ADMIN
    elif role == "ADMIN":
        pass

    else:
        raise HTTPException(403, "Unauthorized")

    trade.status = status
    trade.updated_at = datetime.utcnow()

    history = TradeStatusHistory(
        trade_id=trade.id,
        status=status,
        changed_by_id=user_id,
        remarks=remarks
    )

    db.add(history)
    db.commit()

    return {
        "message": "Trade status updated",
        "trade_id": trade.id,
        "status": trade.status
    }


# =========================================================
# ASSIGN BANK TO TRADE
# =========================================================
@router.post("/{trade_id}/assign-bank")
def assign_bank_to_trade(
    trade_id: int,
    bank_email: str = Body(..., embed=True),
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    if trade.buyer_id != int(user["sub"]):
        raise HTTPException(403, "Only buyer can assign bank")

    bank = db.query(User).filter(
        User.email == bank_email,
        User.role == "BANK"
    ).first()

    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    trade.bank_id = bank.id
    trade.status = "BANK_REVIEWING"
    trade.updated_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Bank assigned successfully",
        "trade_id": trade.id,
        "bank_email": bank.email,
        "status": trade.status
    }
