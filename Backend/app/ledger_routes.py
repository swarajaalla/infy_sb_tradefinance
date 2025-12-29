from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib,io
import requests
from app.s3 import s3_client, BUCKET_NAME

from app.database import get_db
from app.models import LedgerEntry, Document, User, LedgerAction
from app.schema import LedgerCreate, LedgerResponse
from app.auth.dependencies import get_current_user
from sqlalchemy import func

router = APIRouter(prefix="/ledger", tags=["Ledger"])

@router.post("/entries", response_model=LedgerResponse)
def create_ledger_entry(
    data: LedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == data.document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    entry = LedgerEntry(
        document_id=data.document_id,
        action=data.action,
        actor_id=current_user.id,
        meta_data=data.meta_data
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry

@router.get("/entries", response_model=list[LedgerResponse])
def list_all_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(LedgerEntry).order_by(LedgerEntry.created_at.desc()).all()


@router.get("/entries/{entry_id}", response_model=LedgerResponse)
def get_entry_by_id(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")

    return entry

@router.get("/documents/{document_id}/entries", response_model=list[LedgerResponse])
def get_document_entries(
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
        "by_action": {action.value: count for action, count in action_stats}
    }
