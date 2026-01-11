from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..auth import get_current_user
from ..models import User, Role, TradeStatus, Ledger
from ..schemas import (
    TradeCreate,
    TradeRead,
    TradeStatusUpdate,
    AssignBankRequest,
)
from .. import crud

router = APIRouter(prefix="/trades", tags=["Trades"])

TRADE_STATUS_EVENTS = {
    TradeStatus.INITIATED,
    TradeStatus.SELLER_CONFIRMED,
    TradeStatus.DOCUMENTS_UPLOADED,
    TradeStatus.BANK_ASSIGNED,
    TradeStatus.BANK_REVIEWING,
    TradeStatus.BANK_APPROVED,
    TradeStatus.PAYMENT_RELEASED,
    TradeStatus.COMPLETED,
    TradeStatus.CANCELLED,
}

# ============================================================
# CREATE TRADE (BUYER ONLY)
# ============================================================
@router.post("/", response_model=TradeRead)
def create_trade(
    data: TradeCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.corporate.value:
        raise HTTPException(403, "Only corporate users can create trades")

    seller = crud.get_user_by_email(session, data.seller_email)
    if not seller:
        raise HTTPException(404, "Seller not found")

    if seller.role != Role.corporate.value:
        raise HTTPException(400, "Seller must be a corporate user")

    trade = crud.create_trade(
        session=session,
        buyer_id=current_user.id,
        seller_id=seller.id,
        description=data.description,
        amount=data.amount,
        currency=data.currency,
    )

    # Initial ledger already created in CRUD
    status_history = session.exec(
        select(Ledger)
        .where(Ledger.document_id == trade.id)
        .order_by(Ledger.timestamp)
    ).all()

    return {
        "id": trade.id,
        "trade_number": trade.trade_number,
        "buyer_id": trade.buyer_id,
        "seller_id": trade.seller_id,
        "bank_id": trade.bank_id,
        "description": trade.description,
        "amount": trade.amount,
        "currency": trade.currency,
        "status": trade.status,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "completed_at": trade.completed_at,
        "buyer": current_user,
        "seller": seller,
        "bank": None,
        "status_history": [
            {
                "id": l.id,
                "status": l.event_type,
                "changed_by_id": l.actor_id,
                "remarks": l.description,
                "created_at": l.timestamp,
            }
            for l in status_history
        ],
    }


# ============================================================
# LIST TRADES (ALL ROLES – FULL HISTORY)
# ============================================================
@router.get("/")
def list_trades(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    trades = crud.list_trades_for_user(session, current_user)
    response = []

    for trade in trades:
        buyer = session.get(User, trade.buyer_id)
        seller = session.get(User, trade.seller_id)
        bank = session.get(User, trade.bank_id) if trade.bank_id else None

        ledger_entries = session.exec(
            select(Ledger).where(
                Ledger.document_id == trade.id,
                Ledger.event_type.in_(TRADE_STATUS_EVENTS)
            ).order_by(Ledger.timestamp)
        ).all()

        response.append({
            "id": trade.id,
            "trade_number": trade.trade_number,
            "buyer_id": trade.buyer_id,
            "seller_id": trade.seller_id,
            "bank_id": trade.bank_id,
            "description": trade.description,
            "amount": f"{trade.amount:.2f}",
            "currency": trade.currency,
            "status": trade.status,
            "created_at": trade.created_at,
            "updated_at": trade.updated_at,
            "completed_at": trade.completed_at,
            "buyer": buyer,
            "seller": seller,
            "bank": bank,
            "status_history": [
                {
                    "id": l.id,
                    "status": l.event_type,
                    "changed_by_id": l.actor_id,
                    "remarks": l.description,
                    "created_at": l.timestamp,
                }
                for l in ledger_entries
            ],
        })

    return response


# ============================================================
# GET SINGLE TRADE (FULL HISTORY)
# ============================================================
@router.get("/{trade_id}")
def get_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    trade = crud.get_trade_by_id(session, trade_id)
    if not trade:
        raise HTTPException(404, "Trade not found")

    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        if current_user.id not in {
            trade.buyer_id,
            trade.seller_id,
            trade.bank_id,
        }:
            raise HTTPException(403, "Access denied")

    buyer = session.get(User, trade.buyer_id)
    seller = session.get(User, trade.seller_id)
    bank = session.get(User, trade.bank_id) if trade.bank_id else None

    ledger_entries = session.exec(
        select(Ledger)
        .where(
            Ledger.document_id == trade.id,
            Ledger.event_type.in_(TRADE_STATUS_EVENTS)
        ).order_by(Ledger.timestamp)
    ).all()

    return {
        "id": trade.id,
        "trade_number": trade.trade_number,
        "buyer_id": trade.buyer_id,
        "seller_id": trade.seller_id,
        "bank_id": trade.bank_id,
        "description": trade.description,
        "amount": f"{trade.amount:.2f}",
        "currency": trade.currency,
        "status": trade.status,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "completed_at": trade.completed_at,
        "buyer": buyer,
        "seller": seller,
        "bank": bank,
        "status_history": [
            {
                "id": l.id,
                "status": l.event_type,
                "changed_by_id": l.actor_id,
                "remarks": l.description,
                "created_at": l.timestamp,
            }
            for l in ledger_entries
        ],
    }


# ============================================================
# UPDATE TRADE STATUS
# ============================================================
@router.patch("/{trade_id}/status")
def update_trade_status(
    trade_id: int,
    data: TradeStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    trade = crud.get_trade_by_id(session, trade_id)
    if not trade:
        raise HTTPException(404, "Trade not found")

    updated_trade = crud.update_trade_status(
        session=session,
        trade=trade,
        actor=current_user,
        new_status=data.status,
        remarks=data.remarks or data.status,
    )

    return {
        "message": "Trade status updated successfully",
        "trade_id": updated_trade.id,
        "new_status": updated_trade.status,
    }


# ============================================================
# ASSIGN BANK (BUYER ONLY)
# ============================================================
@router.post("/{trade_id}/assign-bank")
def assign_bank(
    trade_id: int,
    data: AssignBankRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    trade = crud.get_trade_by_id(session, trade_id)
    if not trade:
        raise HTTPException(404, "Trade not found")

    if current_user.id != trade.buyer_id:
        raise HTTPException(403, "Only buyer can assign bank")

    if trade.status != TradeStatus.DOCUMENTS_UPLOADED:
        raise HTTPException(400, "Assign bank only after documents upload")

    bank = crud.get_user_by_email(session, data.bank_email)
    if not bank or bank.role != Role.bank.value:
        raise HTTPException(400, "Invalid bank")

    updated_trade = crud.assign_bank_to_trade(
        session=session,
        trade=trade,
        bank=bank,
        actor=current_user,
    )

    return {
        "message": "Bank assigned successfully",
        "trade_id": updated_trade.id,
        "bank_id": bank.id,
        "status": updated_trade.status,
    }
