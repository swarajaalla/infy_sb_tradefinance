# Backend/app/ledger_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import LedgerEntry, Document, Trade, User
from app.schema import LedgerCreate, LedgerResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/ledger", tags=["Ledger"])


# -------------------------------------------------
# CREATE LEDGER ENTRY
# -------------------------------------------------
@router.post("/entries", response_model=LedgerResponse)
def create_ledger_entry(
    data: LedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate: at least one reference required
    if not data.document_id and not data.trade_id:
        raise HTTPException(
            status_code=400,
            detail="Either document_id or trade_id must be provided"
        )

    # Validate document
    if data.document_id:
        document = db.query(Document).filter(Document.id == data.document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

    # Validate trade
    if data.trade_id:
        trade = db.query(Trade).filter(Trade.id == data.trade_id).first()
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")

    entry = LedgerEntry(
        document_id=data.document_id,
        trade_id=data.trade_id,
        action=data.action,
        actor_id=current_user.id,
        meta_data=data.meta_data
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


# -------------------------------------------------
# LIST ALL LEDGER ENTRIES
# -------------------------------------------------
@router.get("/entries", response_model=list[LedgerResponse])
def list_ledger_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin & Auditor → full access
    if current_user.role.value in ["admin", "auditor"]:
        return (
            db.query(LedgerEntry)
            .order_by(LedgerEntry.created_at.desc())
            .all()
        )

    # Corporate / Bank → only their own actions
    return (
        db.query(LedgerEntry)
        .filter(LedgerEntry.actor_id == current_user.id)
        .order_by(LedgerEntry.created_at.desc())
        .all()
    )


# -------------------------------------------------
# GET LEDGER ENTRY BY ID
# -------------------------------------------------
@router.get("/entries/{entry_id}", response_model=LedgerResponse)
def get_ledger_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")

    # Restrict access
    if current_user.role.value not in ["admin", "auditor"]:
        if entry.actor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return entry


# -------------------------------------------------
# GET LEDGER ENTRIES BY DOCUMENT
# -------------------------------------------------
@router.get("/documents/{document_id}/entries", response_model=list[LedgerResponse])
def get_document_ledger_entries(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return (
        db.query(LedgerEntry)
        .filter(LedgerEntry.document_id == document_id)
        .order_by(LedgerEntry.created_at.asc())
        .all()
    )


# -------------------------------------------------
# GET LEDGER ENTRIES BY TRADE
# -------------------------------------------------
@router.get("/trades/{trade_id}/entries", response_model=list[LedgerResponse])
def get_trade_ledger_entries(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    return (
        db.query(LedgerEntry)
        .filter(LedgerEntry.trade_id == trade_id)
        .order_by(LedgerEntry.created_at.asc())
        .all()
    )


# -------------------------------------------------
# LEDGER SUMMARY / STATS
# -------------------------------------------------
@router.get("/status")
def ledger_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_entries = db.query(LedgerEntry).count()

    action_stats = (
        db.query(LedgerEntry.action, func.count(LedgerEntry.id))
        .group_by(LedgerEntry.action)
        .all()
    )

    return {
        "total_entries": total_entries,
        "by_action": {action: count for action, count in action_stats}
    }
