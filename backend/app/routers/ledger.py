from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..database import get_session
from ..auth import get_current_user
from ..models import User, Role
from ..schemas import LedgerRead
from .. import crud

router = APIRouter(prefix="/ledger", tags=["Ledger"])


# -------------------- VIEW ALL ENTRIES --------------------
@router.get("/entries/all", response_model=list[LedgerRead])
def get_all_entries(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.auditor.value:
        raise HTTPException(403, "Only auditors can view ledger entries")
    return crud.list_ledger_entries(session)


# -------------------- VIEW SINGLE ENTRY --------------------
@router.get("/entries/{entry_id}", response_model=LedgerRead)
def get_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.auditor.value:
        raise HTTPException(403, "Only auditors allowed")

    entry = crud.get_ledger_entry(session, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    return entry


# -------------------- VIEW ENTRIES FOR A DOCUMENT --------------------
@router.get("/entries/document/{document_id}", response_model=list[LedgerRead])
def get_doc_entries(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.auditor.value:
        raise HTTPException(403, "Only auditors allowed")
    return crud.get_document_ledger_entries(session, document_id)


# -------------------- LEDGER STATS --------------------
@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.auditor.value:
        raise HTTPException(403, "Only auditors allowed")
    return crud.ledger_stats(session)
