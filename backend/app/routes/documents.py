from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Literal
from typing import Optional
import mimetypes
from app.constants.document_types import DOCUMENT_TYPES
from app.utils.hash_utils import compute_sha256
from app.database import SessionLocal
from fastapi.responses import Response
from app.models import Document, LedgerEntry
from app.auth.dependencies import require_role
from app.routes.ledger import create_ledger_entry_internal
from fastapi.responses import StreamingResponse
from io import BytesIO
from fastapi import Query
from app.auth.jwt import decode_access_token
from app.models.trade import Trade
from app.models.trade_status import TradeStatusHistory

router = APIRouter(prefix="/api/documents", tags=["Documents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# DOCUMENT UPLOAD
# =========================
from typing import Optional
from datetime import datetime
from fastapi import UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing_extensions import Literal

@router.post("/upload", status_code=201)
def upload_document(
    doc_type: Literal["INVOICE", "BL", "LOC"] = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    file: UploadFile = File(...),
    trade_id: int | None = Form(None),
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    file_bytes = file.file.read()
    file_hash = compute_sha256(file_bytes)

    document = Document(
        doc_type=doc_type,
        doc_number=doc_number,
        issued_at=issued_at,
        file_name=file.filename,
        file_hash=file_hash,
        file_data=file_bytes,
        uploaded_by=int(user["sub"]),
        org_name=user["org_name"],
        trade_id=trade_id
    )

    db.add(document)

    # 🔁 Trade status update (unchanged behavior)
    if trade_id:
        trade = db.query(Trade).filter(Trade.id == trade_id).first()
        if trade and trade.status == "SELLER_CONFIRMED":
            trade.status = "DOCUMENTS_UPLOADED"
            trade.updated_at = datetime.utcnow()

            history = TradeStatusHistory(
                trade_id=trade.id,
                status="DOCUMENTS_UPLOADED",
                changed_by_id=int(user["sub"]),
                remarks="Documents uploaded"
            )
            db.add(history)

    db.commit()
    db.refresh(document)

    # 🧾 LEDGER ENTRY — SAFE & UNIVERSAL
    try:
        create_ledger_entry_internal(
            db=db,
            document_id=document.id,
            trade_id=trade_id,  # ✅ allowed to be None
            event_type="DOCUMENT_UPLOADED",
            performed_by=int(user["sub"]),
            role=user["role"],
            previous_hash=None,
            current_hash=file_hash
        )
        db.commit()
    except Exception as e:
        # 🚨 DO NOT break API for audit failure
        print("Ledger entry failed:", str(e))

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "trade_id": trade_id
    }



# =========================
# DOCUMENT METADATA
# =========================
@router.put("/update/{doc_id}")
def update_document(
    doc_id: int,
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    file: Optional[UploadFile] = File(None),
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    previous_hash = document.file_hash

    # Update metadata
    document.doc_type = doc_type.upper()
    document.doc_number = doc_number
    document.issued_at = issued_at

    # 🔁 If new file uploaded
    if file:
        file_bytes = file.file.read()
        new_hash = compute_sha256(file_bytes)

        document.file_name = file.filename
        document.file_hash = new_hash
        document.file_data = file_bytes   # ✅ IMPORTANT
        document.file_url = None           # optional / can be removed entirely

        create_ledger_entry_internal(
            db=db,
            document_id=document.id,
            event_type="UPDATED_FILE",
            performed_by=int(user["sub"]),
            role=user["role"],
            previous_hash=previous_hash,
            current_hash=new_hash
        )

    db.commit()

    return {
        "message": "Document updated successfully",
        "document_id": document.id,
        "doc_type": document.doc_type,
        "doc_number": document.doc_number,
        "issued_at": document.issued_at,
        "hash": document.file_hash
    }



# =========================
# DOCUMENT FETCHING
# =========================
from sqlalchemy import or_
from app.models.trade import Trade

@router.get("/my")
def get_my_documents(
    user = Depends(require_role("CORPORATE")),
    db: Session = Depends(get_db)
):
    user_id = int(user["sub"])

    documents = (
        db.query(Document)
        .outerjoin(Trade, Document.trade_id == Trade.id)
        .filter(
            or_(
                Document.uploaded_by == user_id,   # uploaded by me
                Trade.buyer_id == user_id,         # I am buyer
                Trade.seller_id == user_id         # I am seller
            )
        )
        .order_by(Document.created_at.desc())
        .all()
    )

    return [
        {
            "id": d.id,
            "doc_type": d.doc_type,
            "doc_number": d.doc_number,
            "issued_at": d.issued_at,
            "file_name": d.file_name,
            "file_hash": d.file_hash,
            "uploaded_by": d.uploaded_by,
            "org_name": d.org_name,
            "trade_id": d.trade_id,
            "created_at": d.created_at
        }
        for d in documents
    ]



@router.get("/list")
def list_documents(
    user = Depends(require_role("BANK", "AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    documents = (
        db.query(Document)
        .order_by(Document.id)
        .all()
    )

    return [
        {
            "id": d.id,
            "doc_type": d.doc_type,
            "doc_number": d.doc_number,
            "issued_at": d.issued_at,
            "file_name": d.file_name,
            "file_hash": d.file_hash,
            "uploaded_by": d.uploaded_by,
            "org_name": d.org_name,
            "created_at": d.created_at
        }
        for d in documents
    ]


@router.get("/by-hash/{hash}")
def get_document_by_hash(
    hash: str,
    user = Depends(require_role("BANK", "AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.file_hash == hash).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
# =========================
# DOCUMENT VERIFICATION (BANK / AUDITOR)
# =========================
@router.post("/verify-hash/{doc_id}")
def verify_document_hash(
    doc_id: int,
    user = Depends(require_role("BANK", "AUDITOR")),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    last_entry = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.document_id == doc_id)
        .order_by(LedgerEntry.created_at.desc())
        .first()
    )

    create_ledger_entry_internal(
        db=db,
        document_id=doc_id,
        event_type="VERIFIED",
        performed_by=int(user["sub"]),
        role=user["role"],
        previous_hash=last_entry.current_hash if last_entry else None,
        current_hash=document.file_hash
    )

    return {
        "document_id": doc_id,
        "hash": document.file_hash,
        "status": "VERIFIED"
    }


@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    user = Depends(require_role("BANK", "AUDITOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc



@router.get("/view/{doc_id}")
def view_document_file(
    doc_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document or not document.file_data:
        raise HTTPException(status_code=404, detail="File not found")

    # ✅ Detect MIME type from filename
    mime_type, _ = mimetypes.guess_type(document.file_name)
    if mime_type is None:
        mime_type = "application/octet-stream"

    return StreamingResponse(
        BytesIO(document.file_data),
        media_type=mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{document.file_name}"'
        }
    )
