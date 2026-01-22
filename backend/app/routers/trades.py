from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from .. import models, auth_utils
from datetime import datetime, timezone

router = APIRouter(prefix="/trades", tags=["Trades & Trace System"])

# -------------------------------------------------
# 1. INITIATE TRADE (Buyer Action)
# -------------------------------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def initiate_trade(
    description: str, 
    amount: float, 
    seller_id: int, 
    bank_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    # Only a user with the 'buyer' role can initiate a trade asset
    if current_user.role != models.UserRole.buyer:
        raise HTTPException(
            status_code=403, 
            detail="Authority Denied: Only users with 'buyer' role can initiate trades"
        )

    trade_num = f"TRD-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    new_trade = models.Trade(
        trade_number=trade_num,
        buyer_id=current_user.id,
        seller_id=seller_id,
        bank_id=bank_id,
        description=description,
        amount=amount,
        status=models.TradeStatus.INITIATED
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    # Immutable Trace Log
    history = models.TradeStatusHistory(
        trade_id=new_trade.id, 
        status=models.TradeStatus.INITIATED.value, 
        remarks=f"Trade asset {trade_num} initiated by Buyer {current_user.name}", 
        changed_by_id=current_user.id
    )
    db.add(history)
    db.commit()
    return new_trade

# -------------------------------------------------
# 2. ISSUE BILL/INVOICE (Seller Action)
# -------------------------------------------------
@router.post("/{trade_id}/issue-bill")
def issue_bill(
    trade_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    
    # Permission Check: Role must be 'seller' and linked to this specific trade
    if not trade or current_user.role != models.UserRole.seller or trade.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Authority Denied: Only the assigned Seller can issue bills")

    invoice = models.Invoice(
        trade_id=trade.id, 
        invoice_number=f"INV-{trade.trade_number}", 
        amount=trade.amount, 
        due_date=datetime.now(timezone.utc)
    )
    trade.status = models.TradeStatus.DOCUMENTS_UPLOADED
    
    history = models.TradeStatusHistory(
        trade_id=trade.id, 
        status=models.TradeStatus.DOCUMENTS_UPLOADED.value,
        remarks="Invoice issued; trade status moved to DOCUMENTS_UPLOADED by Seller", 
        changed_by_id=current_user.id
    )
    db.add(invoice)
    db.add(history)
    db.commit()
    return {"message": "Bill issued and status updated successfully"}

# -------------------------------------------------
# 3. BANK REVIEW & APPROVAL (Bank Action)
# -------------------------------------------------
@router.post("/{trade_id}/approve")
def bank_approve(
    trade_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    
    if not trade or current_user.role != models.UserRole.bank or trade.bank_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only assigned bank nodes can approve this trade")

    trade.status = models.TradeStatus.BANK_APPROVED
    
    history = models.TradeStatusHistory(
        trade_id=trade.id, 
        status=models.TradeStatus.BANK_APPROVED.value,
        remarks="Bank verification complete; status updated to BANK_APPROVED", 
        changed_by_id=current_user.id
    )
    db.add(history)
    db.commit()
    return {"message": "Trade verified and approved by bank node"}

# -------------------------------------------------
# 4. DASHBOARD (Role-Based Filtering)
# -------------------------------------------------
@router.get("/dashboard")
def get_user_dashboard(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    """Dynamically filters trades based on the specific logged-in identity."""
    query = db.query(models.Trade)
    
    if current_user.role == models.UserRole.admin:
        # Admin sees everything for global oversight
        return query.all()
    
    if current_user.role == models.UserRole.bank:
        # Banks see trades where they are the assigned validator
        return query.filter(models.Trade.bank_id == current_user.id).all()

    if current_user.role == models.UserRole.buyer:
        # Buyers see their procurement requests
        return query.filter(models.Trade.buyer_id == current_user.id).all()

    if current_user.role == models.UserRole.seller:
        # Sellers see their outgoing shipments
        return query.filter(models.Trade.seller_id == current_user.id).all()
        
    raise HTTPException(status_code=400, detail="Invalid user role for dashboard access")