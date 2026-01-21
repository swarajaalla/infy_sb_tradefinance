from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/trades", tags=["Trades"])

# ======================================================
# CREATE TRADE (BUYER)
# ======================================================
@router.post("/")
def create_trade(
    seller_id: int,
    amount: int,
    currency: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = models.TradeTransaction(
        buyer_id=current_user.id,
        seller_id=seller_id,
        amount=amount,
        currency=currency,
        status="INITIATED",
        created_at=datetime.utcnow(),
    )

    db.add(trade)
    db.flush()

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="INITIATED",
        meta_data={"status": "INITIATED"},
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()
    db.refresh(trade)

    return trade


# ======================================================
# CONFIRM TRADE (SELLER)
# ======================================================
@router.post("/{trade_id}/confirm")
def confirm_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if not trade:
        raise HTTPException(404, "Trade not found")

    if trade.seller_id != current_user.id:
        raise HTTPException(403, "Only seller can confirm trade")

    trade.status = "SELLER_CONFIRMED"
    trade.updated_at = datetime.utcnow()

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="SELLER_CONFIRMED",
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Trade confirmed by seller"}


# ======================================================
# LIST TRADES
# ======================================================
@router.get("/")
def list_trades(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(models.TradeTransaction).all()


# ======================================================
# TRADE TIMELINE
# ======================================================
@router.get("/{trade_id}/timeline")
def trade_timeline(trade_id: int, db: Session = Depends(get_db)):
    entries = (
        db.query(models.LedgerEntry)
        .filter(models.LedgerEntry.trade_id == trade_id)
        .order_by(models.LedgerEntry.created_at)
        .all()
    )

    return [
        {
            "action": e.action,
            "actor_id": e.actor_id,
            "created_at": e.created_at,
            "meta": e.meta_data,
        }
        for e in entries
    ]


# ======================================================
# ASSIGN BANK (BUYER)
# ======================================================
@router.post("/{trade_id}/assign-bank")
def assign_bank(
    trade_id: int,
    bank_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if not trade:
        raise HTTPException(404, "Trade not found")

    if trade.buyer_id != current_user.id:
        raise HTTPException(403, "Only buyer can assign bank")

    if trade.status != "DOCUMENT_UPLOADED":
        raise HTTPException(400, "Bank can be assigned only after document upload")

    trade.bank_id = bank_id
    trade.status = "BANK_ASSIGNED"
    trade.updated_at = datetime.utcnow()

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="BANK_ASSIGNED",
        meta_data={"bank_id": bank_id},
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Bank assigned successfully"}


# ======================================================
# BANK START REVIEW
# ======================================================
@router.post("/{trade_id}/bank/start-review")
def start_bank_review(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if current_user.role != "bank":
        raise HTTPException(403, "Only bank can start review")

    if trade.bank_id != current_user.id:
        raise HTTPException(403, "Trade not assigned to this bank")

    if trade.status != "BANK_ASSIGNED":
        raise HTTPException(400, "Trade must be BANK_ASSIGNED")

    trade.status = "BANK_REVIEWING"

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="BANK_REVIEWING",
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Bank review started"}


# ======================================================
# BANK APPROVE
# ======================================================
@router.post("/{trade_id}/bank/approve")
def bank_approve(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if trade.status != "BANK_REVIEWING":
        raise HTTPException(400, "Trade must be BANK_REVIEWING")

    trade.status = "BANK_APPROVED"

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="BANK_APPROVED",
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Trade approved by bank"}


# ======================================================
# RELEASE PAYMENT (BANK)
# ======================================================
@router.post("/{trade_id}/bank/release-payment")
def release_payment(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if trade.status != "BANK_APPROVED":
        raise HTTPException(400, "Trade must be BANK_APPROVED")

    trade.status = "PAYMENT_RELEASED"

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="PAYMENT_RELEASED",
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Payment released"}


# ======================================================
# COMPLETE TRADE (BUYER)
# ======================================================
@router.post("/{trade_id}/complete")
def complete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if trade.buyer_id != current_user.id:
        raise HTTPException(403, "Only buyer can complete trade")

    if trade.status != "PAYMENT_RELEASED":
        raise HTTPException(400, "Trade must be PAYMENT_RELEASED")

    trade.status = "COMPLETED"

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        actor_id=current_user.id,
        action="COMPLETED",
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {"message": "Trade completed successfully"}
