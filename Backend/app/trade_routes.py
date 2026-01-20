# app/trade_routes.py
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Trade, User, UserRole, LedgerEntry,TradeStatus,LedgerAction
from app.auth.dependencies import get_current_user
from app.schema import (
    TradeCreate,
    TradeResponse,
    WorkflowStatusUpdate,
    TradeStatusEnum,
    AssignBankRequest,
)

router = APIRouter(prefix="/trades", tags=["Trades"])


# -------------------------------------------------
# Workflow transitions
# -------------------------------------------------
# This is what you probably need
ALLOWED_TRANSITIONS = {
    TradeStatus.INITIATED: [
        TradeStatus.SELLER_CONFIRMED, 
        TradeStatus.CANCELLED
    ],
    TradeStatus.SELLER_CONFIRMED: [
        TradeStatus.DOCUMENTS_UPLOADED, 
        TradeStatus.CANCELLED
    ],
    TradeStatus.DOCUMENTS_UPLOADED: [
        TradeStatus.BANK_REVIEWING, 
        TradeStatus.CANCELLED
    ],
    TradeStatus.BANK_REVIEWING: [
        TradeStatus.BANK_APPROVED, 
        TradeStatus.CANCELLED,
        TradeStatus.DISPUTED
    ],
    TradeStatus.BANK_APPROVED: [
        TradeStatus.PAYMENT_RELEASED, 
        TradeStatus.CANCELLED
    ],
    TradeStatus.PAYMENT_RELEASED: [
        TradeStatus.COMPLETED
    ],
    TradeStatus.DISPUTED: [
        TradeStatus.CANCELLED,
        TradeStatus.COMPLETED
    ],
    TradeStatus.CANCELLED: []  # No transitions from cancelled
}
# -------------------------------------------------
# GET /trades
# -------------------------------------------------
@router.get("/", response_model=list[TradeResponse])
def list_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in [UserRole.admin, UserRole.auditor]:
        return db.query(Trade).all()

    if current_user.role == UserRole.bank:
        return db.query(Trade).filter(
            Trade.issuing_bank_id == current_user.id
        ).all()

    # corporate (buyer / seller)
    return db.query(Trade).filter(
        (Trade.buyer_email == current_user.email) |
        (Trade.seller_email == current_user.email)
    ).all()


# -------------------------------------------------
# POST /trades
# Any corporate can create
# -------------------------------------------------
@router.post("/", response_model=TradeResponse)
def create_trade(
    data: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Only corporates can create trades
    if current_user.role != UserRole.corporate:
        raise HTTPException(
            status_code=403,
            detail="Only corporates can create trades"
        )

    # 2️⃣ Create Trade instance
    trade = Trade(
        buyer_email=current_user.email,
        seller_email=data.seller_email,
        amount=data.amount,
        currency=data.currency,
        description=data.description,
        product_details=data.product_details,
        payment_terms=data.payment_terms,
        status=TradeStatus.INITIATED,  # ✅ Use TradeStatus Enum
        initiated_at=datetime.utcnow(),
    )

    # 3️⃣ Commit trade first to generate trade.id
    db.add(trade)
    db.commit()
    db.refresh(trade)

    # 4️⃣ Add initial ledger entry
    ledger_entry = LedgerEntry(
        trade_id=trade.id,
        action=TradeStatus.INITIATED.value,  # ✅ Store string for DB
        actor_id=current_user.id,
        meta_data=None,
        created_at=datetime.utcnow()
    )

    db.add(ledger_entry)
    db.commit()

    # 5️⃣ Return trade with schema conversion
    return trade


# -------------------------------------------------
# GET /trades/{trade_id}
# -------------------------------------------------
@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    if (
        current_user.role not in [UserRole.admin, UserRole.auditor,UserRole.bank]
        and current_user.email not in [trade.buyer_email, trade.seller_email]
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    return trade


# -------------------------------------------------
# PATCH /trades/{trade_id}/status
# -------------------------------------------------

#from app.models import TradeStatus  # Import the model enum

@router.patch("/{trade_id}/status", response_model=TradeResponse)
def update_trade_status(
    trade_id: int,
    data: WorkflowStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.auditor:
        raise HTTPException(
            status_code=403,
            detail="Auditor has read-only access and cannot modify trades"
        )

    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    current_status = trade.status  # This is TradeStatus (model enum)
    # Convert schema enum to model enum for consistency
    next_status = TradeStatus(data.action.value)  # Convert TradeStatusEnum to TradeStatus
    
    # Make sure ALLOWED_TRANSITIONS uses TradeStatus enum keys
    if next_status not in ALLOWED_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition {current_status} → {next_status}",
        )

    # ---- Permission checks ----
    # Use the same enum type for consistency
    if next_status in [
        TradeStatus.SELLER_CONFIRMED,  # Use TradeStatus, not TradeStatusEnum
        TradeStatus.DOCUMENTS_UPLOADED,
    ]:
        if current_user.email != trade.seller_email:
            raise HTTPException(
                status_code=403,
                detail="Only seller can perform this action",
            )

    if next_status in [
        TradeStatus.BANK_REVIEWING,
        TradeStatus.BANK_APPROVED,
        TradeStatus.PAYMENT_RELEASED,
    ]:
        if current_user.role != UserRole.bank:
            raise HTTPException(
                status_code=403,
                detail="Only bank can perform this action",
            )

    if next_status == TradeStatus.COMPLETED:
        if current_user.email not in [
            trade.buyer_email,
            trade.seller_email,
        ]:
            raise HTTPException(
                status_code=403,
                detail="Only buyer or seller can complete trade",
            )

    # ---- Update timestamps ----
    trade.status = next_status
    now = datetime.utcnow()

    if next_status == TradeStatus.SELLER_CONFIRMED:
        trade.confirmed_at = now
    elif next_status == TradeStatus.DOCUMENTS_UPLOADED:
        trade.documents_uploaded_at = now
    elif next_status == TradeStatus.BANK_REVIEWING:
        trade.bank_review_started_at = now
    elif next_status == TradeStatus.BANK_APPROVED:
        trade.bank_approved_at = now
    elif next_status == TradeStatus.PAYMENT_RELEASED:
        trade.payment_released_at = now
    elif next_status == TradeStatus.COMPLETED:
        trade.completed_at = now

    db.add(
        LedgerEntry(
            trade_id=trade.id,
            action=next_status.value,  # Store the string value
            actor_id=current_user.id,
            meta_data={"notes": data.notes},
        )
    )

    db.commit()
    db.refresh(trade)

    return trade

# -------------------------------------------------
# POST /trades/assign-bank
# -------------------------------------------------
@router.post("/assign-bank", response_model=TradeResponse)
def assign_bank(
    request: AssignBankRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == UserRole.auditor:
        raise HTTPException(
            status_code=403,
            detail="Auditor has read-only access and cannot assign banks"
        )
        
    # 1️⃣ Only buyer (corporate) can assign bank
    if current_user.role != UserRole.corporate:
        raise HTTPException(
            status_code=403, detail="Only buyer (corporate) can assign bank"
        )

    # 2️⃣ Fetch trade
    trade = db.query(Trade).filter(Trade.id == request.trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # 3️⃣ Ensure current user is the buyer of this trade
    if trade.buyer_email != current_user.email:
        raise HTTPException(
            status_code=403, detail="Only the buyer of this trade can assign bank"
        )

    # 4️⃣ Prevent reassignment
    if trade.issuing_bank_id:
        raise HTTPException(
            status_code=400, detail="Bank already assigned to this trade"
        )

    # 5️⃣ Find bank by email
    bank = (
        db.query(User)
        .filter(User.email == request.bank_email, User.role == UserRole.bank)
        .first()
    )
    if not bank:
        raise HTTPException(
            status_code=404, detail="Bank user not found or not a bank"
        )

    # 6️⃣ Assign bank
    trade.issuing_bank_id = bank.id
    trade.status = LedgerAction.BANK_REVIEWING.value  # Update trade status

    # 7️⃣ Create ledger entry
    ledger_entry = LedgerEntry(
        trade_id=trade.id,
        action=LedgerAction.BANK_REVIEWING,  # ✅ Use Enum
        actor_id=current_user.id,
        meta_data={
            "bank_email": bank.email,
            "assigned_by": current_user.email,
        },
    )

    # 8️⃣ Commit changes
    try:
        db.add(trade)
        db.add(ledger_entry)
        db.commit()
        db.refresh(trade)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to assign bank: {str(e)}")

    return trade
