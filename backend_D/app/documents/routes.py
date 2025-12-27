from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models
from app.documents.utils import generate_file_hash
from datetime import datetime
from pathlib import Path
from app.documents.utils import generate_file_hash



router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploaded_docs"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


@router.post("/upload")
def upload_document(
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    issued_at: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Read file bytes
    file_bytes = file.file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Generate SHA-256 hash
    file_hash = generate_file_hash(file_bytes)

    # Save file locally
    filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Create document record in DB
    document = models.Document(
        owner_id=current_user.id,
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=file_path,
        hash=file_hash,
        issued_at=None,
        created_at=datetime.utcnow(),
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    ledger_entry = models.LedgerEntry(
    document_id=document.id,
    action=models.LedgerAction.ISSUED,
    actor_id=current_user.id,
    meta_data={"note": "Document issued"}
)
    db.add(ledger_entry)
    db.commit()
    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "hash": document.hash,
    }

@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    documents = (
        db.query(models.Document)
        .filter(models.Document.owner_id == current_user.id)
        .order_by(models.Document.created_at.desc())
        .all()
    )

    return documents


@router.post("/{document_id}/verify")
def verify_document(
    document_id: int,
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

    if document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = Path(document.file_url)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    # Read file & calculate hash
    with open(file_path, "rb") as f:
        current_hash = generate_file_hash(f.read())

    is_valid = current_hash == document.hash

    return {
        "document_id": document.id,
        "valid": is_valid,
        "stored_hash": document.hash,
        "current_hash": current_hash,
    }

