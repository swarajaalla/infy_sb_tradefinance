from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from datetime import datetime
import hashlib, os, uuid

from ..database import get_session
from ..models import User, Role, DocumentType, Ledger,TradeStatus
from ..schemas import DocumentRead
from ..auth import get_current_user
from .. import crud

router = APIRouter(prefix="/documents", tags=["Documents"])

# --------------------------------------------------
# FILE STORAGE
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def compute_sha256(file: UploadFile) -> str:
    sha = hashlib.sha256()
    file.file.seek(0)
    for chunk in iter(lambda: file.file.read(4096), b""):
        sha.update(chunk)
    file.file.seek(0)
    return sha.hexdigest()


# ==================================================
# UPLOAD DOCUMENT (SELLER / BUYER CORPORATE ONLY)
# ==================================================
@router.post("/upload")
def upload_document(
    trade_id: int = Form(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.corporate.value:
        raise HTTPException(403, "Only corporate users can upload documents")

    trade = crud.get_trade_by_id(session, trade_id)
    if not trade:
        raise HTTPException(404, "Trade not found")

    if current_user.id != trade.seller_id:
        raise HTTPException(403, "Only seller can upload trade documents")

    file_hash = compute_sha256(file)

    filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    doc = crud.create_document(
        session=session,
        doc_type=doc_type.value,
        trade_id=trade.id, 
        doc_number=doc_number,
        file_url=f"/uploads/{filename}",
        hash_value=file_hash,
        issued_at=issued_at,
        owner=current_user,
    )

    if trade.status == TradeStatus.SELLER_CONFIRMED:
        crud.update_trade_status(
        session=session,
        trade=trade,
        actor=current_user,
        new_status=TradeStatus.DOCUMENTS_UPLOADED,
        remarks="Documents uploaded by seller",
    )
    elif trade.status == TradeStatus.DOCUMENTS_UPLOADED:
        pass  # allow multiple document uploads without re-logging status
    else:
        crud.create_ledger_entry(
        session=session,
        document_id=doc.id,
        actor=current_user,
        event_type="UPLOADED",
        description="Document uploaded",
    )

    return {
        "message": "Document uploaded successfully",
        "trade_id": trade.id,
        "document_id": doc.id,
        "document_hash": doc.hash,
        "trade_status": trade.status,
    }

# ==================================================
# LIST DOCUMENTS (ROLE-BASED)
# ==================================================
@router.get("/list", response_model=list[DocumentRead])
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role == Role.auditor.value:
        return crud.list_all_documents(session)

    if current_user.role in {Role.bank.value, Role.corporate.value}:
        return crud.list_documents_for_org(session, current_user.org_name)

    raise HTTPException(403, "Not allowed")


# ==================================================
# VIEW DOCUMENT (LEDGER TRACKED)
# ==================================================
@router.get("/view/{document_id}", response_model=DocumentRead)
def view_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    doc = crud.get_document_by_id(session, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    if current_user.role != Role.auditor.value and doc.org_name != current_user.org_name:
        raise HTTPException(403, "Access denied")

    # Ledger entry: ACCESSED
    crud.create_ledger_entry(
        session=session,
        document_id=doc.id,
        actor=current_user,
        event_type="ACCESSED",
        description="Document viewed",
    )

    return doc


# ==================================================
# GET DOCUMENT BY HASH (LEDGER TRACKED)
# ==================================================
@router.get("/by-hash/{hash_code}", response_model=DocumentRead)
def get_document_by_hash(
    hash_code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role == Role.auditor.value:
        doc = crud.get_document_by_hash(session, hash_code)
    else:
        doc = crud.get_document_by_hash_and_org(
            session, hash_code, current_user.org_name
        )

    if not doc:
        raise HTTPException(404, "Document not found")

    # Ledger entry: ACCESSED
    crud.create_ledger_entry(
        session=session,
        document_id=doc.id,
        actor=current_user,
        event_type="ACCESSED",
        description="Accessed via hash",
    )

    return doc


# ==================================================
# VERIFY DOCUMENT HASH (BANK / AUDITOR ONLY)
# ==================================================
@router.post("/verify-hash")
def verify_document_hash(
    hash_code: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.bank.value, Role.auditor.value, Role.corporate.value}:
        raise HTTPException(403, "Only bank or auditor can verify document hash")

    calculated_hash = compute_sha256(file)
    doc = crud.get_document_by_hash(session, hash_code)

    if not doc:
        return {
            "verified": False,
            "status": "FAILED",
            "reason": "Document not found",
        }

    if calculated_hash != doc.hash:
        return {
            "verified": False,
            "status": "FAILED",
            "reason": "Hash mismatch",
        }

    # Ledger entry: VERIFIED
    crud.create_ledger_entry(
        session=session,
        document_id=doc.id,
        actor=current_user,
        event_type="VERIFIED",
        description="Document hash verified",
        hash_before=doc.hash,
        hash_after=calculated_hash,
    )

    return {
        "verified": True,
        "status": "PASSED",
        "document_id": doc.id,
    }


# ==================================================
# UPDATE DOCUMENT (ONLY BEFORE VERIFICATION)
# ==================================================
@router.put("/update/{document_id}")
def update_document(
    document_id: int,
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    doc = crud.get_document_by_id(session, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    if current_user.role != Role.corporate.value:
        raise HTTPException(403, "Only corporate users can update documents")

    if doc.org_name != current_user.org_name:
        raise HTTPException(403, "Cross-organisation update forbidden")

    # ❌ BLOCK update if document already VERIFIED
    verified_entry = session.exec(
        select(Ledger).where(
            Ledger.document_id == document_id,
            Ledger.event_type == "VERIFIED",
        )
    ).first()

    if verified_entry:
        raise HTTPException(
            400,
            "Document already verified and cannot be modified",
        )

    old_hash = doc.hash
    new_hash = compute_sha256(file)

    filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    doc.doc_type = doc_type.value
    doc.doc_number = doc_number
    doc.hash = new_hash
    doc.file_url = f"/uploads/{filename}"

    session.commit()
    session.refresh(doc)

    # Ledger entry: MODIFIED
    crud.create_ledger_entry(
        session=session,
        document_id=doc.id,
        actor=current_user,
        event_type="MODIFIED",
        description="Document updated",
        hash_before=old_hash,
        hash_after=new_hash,
    )

    return {
        "message": "Document updated successfully",
        "hash_before": old_hash,
        "hash_after": new_hash,
    }
