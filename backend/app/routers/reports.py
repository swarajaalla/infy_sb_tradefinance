from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth_utils import get_current_user
from .. import models

router = APIRouter(prefix="/reports", tags=["Reporting & Audit Export"])

# 

@router.get("/{trade_id}/summary")
def get_trade_report(
    trade_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Comprehensive Data Interconnection:
    Fetches Trade details, the immutable status timeline, and associated billing.
    """
    # 1. Fetch the trade with authorized access check
    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade record not found in the ledger.")

    # 2. RBAC Enforcement: Ensure users only see reports they are authorized to view
    is_admin = current_user.role == models.UserRole.admin
    is_participant = (current_user.id in [trade.buyer_id, trade.seller_id, trade.bank_id])

    if not (is_admin or is_participant):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied: You are not a participant in this trade asset."
        )

    # 3. Structured Data Return
    return {
        "trade_id": trade.id,
        "trade_number": trade.trade_number,
        "summary": {
            "description": trade.description,
            "amount": float(trade.amount),
            "currency": trade.currency,
            "current_status": trade.status
        },
        # Interconnecting the status history for the 'Trace' timeline UI
        "timeline": [
            {
                "status": h.status,
                "timestamp": h.created_at,
                "remarks": h.remarks
            } for h in trade.status_history
        ],
        # Interconnecting billing/invoice data
        "billing": [
            {
                "invoice_number": i.invoice_number,
                "amount": float(i.amount),
                "is_paid": bool(i.is_paid),
                "due_date": i.due_date
            } for i in trade.invoices
        ]
    }