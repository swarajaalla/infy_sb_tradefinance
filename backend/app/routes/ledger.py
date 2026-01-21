from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.ledger import LedgerEntry
from app.models.document import Document
from app.auth.dependencies import require_role
from typing import Dict, Any

router = APIRouter(prefix="/api/ledger", tags=["Ledgers"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_ledger_entry_internal(
    *,
    db: Session,
    document_id: int,
    event_type: str,
    performed_by: int,
    role: str,
    previous_hash: Optional[str],
    current_hash: Optional[str],
    trade_id: int | None = None,
):
    entry = LedgerEntry(
        document_id=document_id,
        trade_id=trade_id, 
        event_type=event_type,
        performed_by=performed_by,
        role=role,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

# CREATE LEDGER ENTRY
@router.post("/add")
def add_ledger_entry(
    document_id: int,
    event_type: str,
    user = Depends(require_role("BANK", "ADMIN")),
    db: Session = Depends(get_db)
):
    last_entry = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.document_id == document_id)
        .order_by(LedgerEntry.created_at.desc())
        .first()
    )

    entry = create_ledger_entry_internal(
        db=db,
        document_id=document_id,
        event_type=event_type,
        performed_by=int(user["sub"]),
        role=user["role"],
        previous_hash=last_entry.current_hash if last_entry else None,
        current_hash=last_entry.current_hash if last_entry else None
    )

    return {
        "message": "Ledger entry created",
        "ledger_id": entry.id
    }



# GET ALL LEDGER ENTRIES
@router.get("/all")
def get_all_ledger_entries(
    user = Depends(require_role("AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    return (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.created_at)
        .all()
    )

@router.get("/stats")
def ledger_stats(
    user: Dict[str, Any] = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    return {
        "total_entries": db.query(LedgerEntry).count(),
        "verified_count": db.query(LedgerEntry)
            .filter(LedgerEntry.event_type == "VERIFIED")
            .count(),
        "uploaded_count": db.query(LedgerEntry)
            .filter(LedgerEntry.event_type == "UPLOADED")
            .count()
    }

# GET SINGLE LEDGER ENTRY
@router.get("/{id}")
def get_single_ledger_entry(
    id: int,
    user = Depends(require_role("AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return entry

# =========================
# EXISTING ROUTE (UNCHANGED)
# =========================
@router.get("/document/{document_id}")
def get_ledger_for_document(
    document_id: int,
    user = Depends(require_role("BANK", "AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    return (
        db.query(LedgerEntry)
        .filter(LedgerEntry.document_id == document_id)
        .order_by(LedgerEntry.created_at)
        .all()
    )


# =========================
# EXISTING ROUTE (UNCHANGED)
# =========================




# =====================================================
# NEW ROUTES (ADDED – DOES NOT BREAK EXISTING ONES)
# =====================================================
