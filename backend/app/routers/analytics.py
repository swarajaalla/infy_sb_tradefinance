from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..auth_utils import get_current_user
from .. import models

router = APIRouter(prefix="/analytics", tags=["Risk & Dashboard Analytics"])

# 

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Role-Aware Statistics:
    - Admin: Global Network Stats
    - Buyer/Seller: Organization specific document counts
    """
    # 1. Base Query based on Role
    doc_query = db.query(models.Document)
    
    # Filter by Org unless user is a global Admin
    if current_user.role != models.UserRole.admin:
        doc_query = doc_query.filter(models.Document.org_id == current_user.org_id)
    
    total_docs = doc_query.count()

    # 2. Logic for JSON extra_data filtering
    # Note: .astext is used for Postgres. For SQLite, we use simple string casting.
    ledger_query = db.query(models.LedgerEntry).join(models.Document)
    
    if current_user.role != models.UserRole.admin:
        ledger_query = ledger_query.filter(models.Document.org_id == current_user.org_id)

    verified_docs = ledger_query.filter(
        models.LedgerEntry.action == models.LedgerAction.VERIFIED
    ).count()

    # 3. Calculate Tampered Stats for the 'Security Alerts' badge
    # This powers the red notifications in the Admin/Corporate dashboards
    alerts_count = db.query(models.IntegrityAlert).join(models.Document).filter(
        models.Document.org_id == current_user.org_id,
        models.IntegrityAlert.is_acknowledged == False
    ).count()

    return {
        "total_documents": total_docs,
        "verified": verified_docs,
        "tampered": alerts_count, # Linked to the new IntegrityAlert model
        "this_month": total_docs,
        "network_role": current_user.role.value # Tells frontend which dashboard UI to load
    }

@router.get("/risk-profile")
def get_user_risk_score(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches the risk profile. Buyers see their procurement risk, 
    Sellers see their fulfillment risk.
    """
    risk = db.query(models.RiskScore).filter(
        models.RiskScore.user_id == current_user.id
    ).first()

    if not risk:
        # Default base risk for new users
        return {
            "score": 10.0,
            "rationale": "Base network trust score for new identity.",
            "status": "Healthy"
        }

    return {
        "score": float(risk.score),
        "rationale": risk.rationale,
        "last_updated": risk.last_updated
    }