from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models
from datetime import datetime
from fastapi import Body


router = APIRouter(
    prefix="/ledger",
    tags=["Ledger"]
)


@router.get("/{document_id}")
def get_ledger_timeline(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Check document exists
    document = (
        db.query(models.Document)
        .filter(models.Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Optional: ownership / role check (can be extended later)
    if document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch ledger entries
    ledger_entries = (
        db.query(models.LedgerEntry)
        .filter(models.LedgerEntry.document_id == document_id)
        .order_by(models.LedgerEntry.created_at.asc())
        .all()
    )

    return ledger_entries


@router.post("/{document_id}/action")
def add_ledger_action(
    document_id: int,
    action: str = Body(..., embed=True),
    note: str = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    document = (
        db.query(models.Document)
        .filter(models.Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Optional role-based checks (future)
    # e.g. only bank/auditor can VERIFY

    ledger_entry = models.LedgerEntry(
        document_id=document_id,
        action=action.upper(),
        actor_id=current_user.id,
        created_at=datetime.utcnow(),
        meta_data={"note": note} if note else {}
    )

    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)

    return ledger_entry

