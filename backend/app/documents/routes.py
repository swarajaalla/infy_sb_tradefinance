from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import os
from app.documents.utils import generate_file_hash
from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_document(
    trade_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter_by(id=trade_id).first()

    if not trade:
        raise HTTPException(404, "Trade not found")

    if trade.seller_id != current_user.id:
        raise HTTPException(403, "Only seller can upload documents")

    if trade.status != "SELLER_CONFIRMED":
        raise HTTPException(400, "Trade not ready for document upload")

    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

        file_hash = generate_file_hash(path)

    document = models.Document(
        trade_id=trade.id,
        owner_id=current_user.id,
        doc_type=doc_type,
        doc_number=str(uuid.uuid4())[:8],
        file_url=path,
        hash=file_hash,
        created_at=datetime.utcnow(),
    )

    db.add(document)
    db.flush()

    trade.status = "DOCUMENT_UPLOADED"
    trade.updated_at = datetime.utcnow()

    ledger = models.LedgerEntry(
        trade_id=trade.id,
        document_id=document.id,
        actor_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        meta_data={"doc_type": doc_type,
                   "document_id": document.id,
                   "hash": file_hash},
                   
                   
        
        created_at=datetime.utcnow(),
    )

    db.add(ledger)
    db.commit()

    return {
        "message": "Document uploaded successfully",
        "trade_id": trade.id,
        "status": trade.status,
        "document_id": document.id,
        "hash": file_hash
    }
@router.get("/{document_id}/verify")
def verify_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = db.query(models.Document).filter_by(id=document_id).first()

    if not document:
        raise HTTPException(404, "Document not found")

    # Recalculate hash
    current_hash = generate_file_hash(document.file_url)

    if current_hash == document.hash:
        status = "VALID"
    else:
        status = "TAMPERED"

    return {
        "document_id": document.id,
        "stored_hash": document.hash,
        "current_hash": current_hash,
        "integrity_status": status,
    }

