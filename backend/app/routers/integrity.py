from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from ..auth_utils import get_current_user
from .. import models

router = APIRouter(prefix="/integrity", tags=["System Integrity & Security"])

# 1. THE INTEGRITY STATUS TABLE DATA
@router.get("/status-report")
def get_integrity_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches every document and its latest hash verification result.
    Matches the 'Integrity Status' grid in the Admin/Bank dashboards.
    """
    # Security Gate: Only Admin or Bank can see system-wide integrity
    if current_user.role not in [models.UserRole.admin, models.UserRole.bank]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Forbidden: Admin or Bank authority required."
        )

    docs = db.query(models.Document).all()
    report = []

    for doc in docs:
        # Fetch latest verification from the Immutable Ledger
        latest_audit = db.query(models.LedgerEntry).filter(
            models.LedgerEntry.document_id == doc.id,
            models.LedgerEntry.action == models.LedgerAction.VERIFIED
        ).order_by(models.LedgerEntry.created_at.desc()).first()

        # Logic to determine PASS/FAIL status based on cryptographic hash
        status_label = "PENDING"
        computed_hash = "-"
        
        if latest_audit:
            # Safely check extra_data for the verification result
            status_label = latest_audit.extra_data.get("result", "FAIL")
            computed_hash = latest_audit.extra_data.get("computed_hash", "N/A")

        report.append({
            "id": f"#{doc.id}",
            "doc_number": doc.doc_number,
            "doc_type": doc.doc_type,
            "hash_type": "SHA256",
            "status": status_label,  # Rendered as 'PASS' or 'FAIL' in the UI grid
            "expected_hash": doc.hash,
            "computed_hash": computed_hash,
            "org_name": doc.organization.name if doc.organization else "N/A"
        })

    return report

# 2. THE ALERT BANNER LOGIC
@router.get("/alerts")
def get_unacknowledged_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Powers the red dashboard notification for tampered documents.
    """
    if current_user.role not in [models.UserRole.admin, models.UserRole.bank]:
        return {"count": 0}

    # Count active (unacknowledged) integrity failures
    fail_count = db.query(models.IntegrityAlert).filter(
        models.IntegrityAlert.is_acknowledged == False
    ).count()

    return {
        "count": fail_count,
        "message": f"{fail_count} Unacknowledged Security Alerts",
        "severity": "CRITICAL" if fail_count > 0 else "NONE"
    }

# 3. BANK-SPECIFIC TRADE ACTIONS
@router.post("/trade/{trade_id}/approve")
def bank_approve_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Bank official releasing funds after integrity verification.
    """
    if current_user.role != models.UserRole.bank:
        raise HTTPException(status_code=403, detail="Authority Denied: Bank role required.")

    trade = db.query(models.Trade).filter(models.Trade.id == trade_id).first()
    if not trade or trade.bank_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assigned Trade record not found.")

    # Update state to BANK_APPROVED and log to immutable trace
    trade.status = models.TradeStatus.BANK_APPROVED
    
    audit_log = models.TradeStatusHistory(
        trade_id=trade.id,
        status=models.TradeStatus.BANK_APPROVED.value,
        changed_by_id=current_user.id,
        remarks="Bank verification successful. Trade funding cleared for release."
    )
    db.add(audit_log)
    db.commit()
    
    return {"status": "success", "new_state": "BANK_APPROVED"}