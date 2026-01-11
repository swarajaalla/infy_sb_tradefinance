from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..auth import get_current_user
from ..models import User, Role, Ledger
from ..schemas import LedgerRead, LedgerCreate
from .. import crud

router = APIRouter(prefix="/ledger", tags=["Ledger"])

# --------------------------------------------------
# GET LEDGER ENTRIES (ADMIN / AUDITOR / BANK ONLY)
# --------------------------------------------------
@router.get("/entries", response_model=list[LedgerRead])
def get_ledger_entries(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Ledger is a legal audit trail.
    Accessible only by Admin, Auditor, and Bank.
    """

    if current_user.role not in {
        Role.admin.value,
        Role.auditor.value,
        Role.bank.value,
        Role.corporate.value,
    }:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view ledger entries",
        )

    # Admin & Auditor → all entries
    if current_user.role in {Role.admin.value, Role.auditor.value}:
        return session.exec(select(Ledger)).all()

    # Bank → only own organisation
    return crud.list_ledger_entries_by_org(
        session, current_user.org_name
    )


# --------------------------------------------------
# GET SINGLE LEDGER ENTRY BY ID
# --------------------------------------------------
@router.get("/entries/{entry_id}", response_model=LedgerRead)
def get_ledger_entry_by_id(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {
        Role.admin.value,
        Role.auditor.value,
        Role.bank.value,
        Role.corporate.value,
    }:
        raise HTTPException(403, "Access denied")

    entry = session.get(Ledger, entry_id)
    if not entry:
        raise HTTPException(404, "Ledger entry not found")

    # Bank must be restricted to own organisation
    if (
        current_user.role in {Role.bank.value,Role.corporate.value}
        and entry.org_name != current_user.org_name
    ):
        raise HTTPException(403, "Access denied")

    return entry


# --------------------------------------------------
# GET LEDGER HISTORY FOR A DOCUMENT
# --------------------------------------------------
@router.get("/entries/document/{document_id}", response_model=list[LedgerRead])
def get_ledger_entries_for_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {
        Role.admin.value,
        Role.auditor.value,
        Role.bank.value,
        Role.corporate.value,
    }:
        raise HTTPException(403, "Access denied")

    query = select(Ledger).where(Ledger.document_id == document_id)

    # Bank must be restricted to own organisation
    if current_user.role in {Role.bank.value,Role.corporate.value}:
        query = query.where(Ledger.org_name == current_user.org_name)

    return session.exec(query).all()


# --------------------------------------------------
# LEDGER SUMMARY (ADMIN / AUDITOR ONLY)
# --------------------------------------------------
@router.get("/summary")
def get_ledger_summary(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Summary of ledger events.
    Used mainly for audit dashboards.
    """

    if current_user.role not in {
        Role.admin.value,
        Role.auditor.value,
    }:
        raise HTTPException(403, "Access denied")

    entries = session.exec(select(Ledger)).all()

    stats = {}
    for e in entries:
        stats[e.event_type] = stats.get(e.event_type, 0) + 1

    return {
        "total_entries": len(entries),
        "by_event_type": stats,
    }


# --------------------------------------------------
# MANUAL LEDGER ENTRY (ADMIN ONLY – EXCEPTIONAL)
# --------------------------------------------------
@router.post("/entries", response_model=LedgerRead)
def create_manual_ledger_entry(
    data: LedgerCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Admin-only endpoint.
    Used ONLY for exceptional recovery or correction.
    Not part of normal workflow.
    """

    if current_user.role != Role.admin.value:
        raise HTTPException(
            status_code=403,
            detail="Only admin can create ledger entries",
        )

    doc = crud.get_document_by_id(session, data.document_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    return crud.create_ledger_entry(
        session=session,
        document_id=data.document_id,
        actor=current_user,
        event_type=data.event_type,
        description=data.description,
        hash_before=data.hash_before,
        hash_after=data.hash_after,
    )
