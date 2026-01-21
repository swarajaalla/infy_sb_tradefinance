from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models

router = APIRouter(
    prefix="/ledger",
    tags=["Ledger"]
)

# =========================
# Get ALL Ledger Entries
# =========================
@router.get("/entries/all")
def get_all_entries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.LedgerEntry)
        .order_by(models.LedgerEntry.created_at.desc())
        .all()
    )


# =========================
# Get Ledger Entry by ID
# =========================
@router.get("/entries/{entry_id}")
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry = db.query(models.LedgerEntry).filter(
        models.LedgerEntry.id == entry_id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    return entry


# =========================
# Get Ledger Entries for Document
# =========================
@router.get("/entries/document/{document_id}")
def get_document_entries(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.LedgerEntry)
        .filter(models.LedgerEntry.document_id == document_id)
        .order_by(models.LedgerEntry.created_at.asc())
        .all()
    )


# =========================
# Ledger Stats
# =========================
@router.get("/stats")
def ledger_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return {
        "total_entries": db.query(models.LedgerEntry).count(),
        "total_documents": db.query(models.Document).count(),
        "latest_activity": db.query(
            func.max(models.LedgerEntry.created_at)
        ).scalar(),
    }
@router.get("/integrity-alerts")
def get_integrity_alerts(db: Session = Depends(get_db)):
    alerts = (
        db.query(models.LedgerEntry)
        .filter(models.LedgerEntry.action == "INTEGRITY_FAILED")
        .order_by(models.LedgerEntry.created_at.desc())
        .all()
    )
    return alerts
