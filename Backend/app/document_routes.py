from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import hashlib
import requests
import io

from app.database import get_db
from app.models import Document, User, DocumentType
from app.schema import DocumentResponse,UpdateMode
from app.auth.dependencies import get_current_user
from app.s3 import upload_file_to_s3

router = APIRouter(tags=["Documents"])


# ----------------------------------------
# Utility: SHA-256 Hash
# ----------------------------------------
def generate_sha256_from_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def generate_sha256(file: UploadFile) -> str:
    file.file.seek(0)
    data = file.file.read()
    file.file.seek(0)
    return generate_sha256_from_bytes(data)


# ----------------------------------------
# POST /create_docs
# ----------------------------------------
@router.post("/create_docs")
def create_document(
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    file: UploadFile = File(...),
    issued_at: datetime | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        doc_type_enum = DocumentType[doc_type.upper()]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document type")

    file_bytes = file.file.read()
    file.file.seek(0)

    file_hash = generate_sha256_from_bytes(file_bytes)
    file_url = upload_file_to_s3(file)

    new_doc = Document(
        owner_id=current_user.id,
        doc_type=doc_type_enum,
        doc_number=doc_number,
        file_url=file_url,
        hash=file_hash,
        issued_at=issued_at
    )

    try:
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Document number already exists"
        )

    return {
        "message": "Document uploaded successfully",
        "document_id": new_doc.id,
        "hash": file_hash
    }


# ----------------------------------------
# GET /list_docs
# ----------------------------------------
@router.get("/list_docs", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = current_user.role.value if hasattr(current_user.role, "value") else current_user.role

    query = db.query(Document, User.org_name).join(User)

    if role not in ["admin", "auditor"]:
        query = query.filter(User.org_name == current_user.org_name)

    docs = query.all()

    return [
        DocumentResponse(
            id=d.id,
            owner_id=d.owner_id,
            doc_type=d.doc_type.value,
            doc_number=d.doc_number,
            file_url=d.file_url,
            hash=d.hash,
            issued_at=d.issued_at,
            created_at=d.created_at,
            org_name=org
        )
        for d, org in docs
    ]


# ----------------------------------------
# GET /documents/hash/{hashcode}
# ----------------------------------------
@router.get("/documents/hash/{hash_code}", response_model=DocumentResponse)
def get_document_by_hash(
    hash_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).join(User).filter(Document.hash == hash_code).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Optional: restrict access based on role/org
    role = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role not in ["admin", "auditor"] and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    return DocumentResponse(
        id=doc.id,
        owner_id=doc.owner_id,
        doc_type=doc.doc_type.value,
        doc_number=doc.doc_number,
        file_url=doc.file_url,
        hash=doc.hash,
        issued_at=doc.issued_at,
        created_at=doc.created_at,
        org_name=doc.owner.org_name
    )

# ----------------------------------------
# POST /documents/verify
# ----------------------------------------
@router.post("/documents/verify")
def verify_document(
    file: UploadFile = File(...),
    hash_code: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    computed_hash = generate_sha256(file)

    if computed_hash != hash_code:
        return {"verified": False, "message": "Hash mismatch"}

    doc = db.query(Document).filter(Document.hash == hash_code).first()

    if not doc:
        return {"verified": False, "message": "Document not registered"}

    return {
        "verified": True,
        "document_id": doc.id,
        "doc_type": doc.doc_type.value,
        "doc_number": doc.doc_number
    }


# ----------------------------------------
# PUT /documents/{id}/file
# mode = overwrite | append
# ----------------------------------------
@router.put("/documents/{document_id}/file")
def update_document_file(
    document_id: int,
    mode: UpdateMode = Form(...),     # overwrite | append
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Read new file
    new_data = file.file.read()

    if mode == "overwrite":
        final_data = new_data

    elif mode == "append":
        # Download existing file from S3
        response = requests.get(doc.file_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to read existing file")

        final_data = response.content + b"\n" + new_data

    else:
        raise HTTPException(status_code=400, detail="Mode must be overwrite or append")

    # Upload merged file
    merged_file = UploadFile(
        filename=file.filename,
        file=io.BytesIO(final_data)
    )

    new_file_url = upload_file_to_s3(merged_file)
    new_hash = generate_sha256_from_bytes(final_data)

    doc.file_url = new_file_url
    doc.hash = new_hash

    db.commit()
    db.refresh(doc)

    return {
        "message": f"Document {mode} successful",
        "document_id": doc.id,
        "new_hash": new_hash
    }




