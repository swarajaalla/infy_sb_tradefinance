from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session
from datetime import datetime
import hashlib, os, uuid

from ..database import get_session
from ..models import User, Role, DocumentType
from ..schemas import DocumentRead
from ..auth import get_current_user
from .. import crud

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def compute_sha256(file: UploadFile) -> str:
    sha = hashlib.sha256()
    file.file.seek(0)
    for chunk in iter(lambda: file.file.read(4096), b""):
        sha.update(chunk)
    file.file.seek(0)
    return sha.hexdigest()


# -------------------- UPLOAD DOCUMENT --------------------
@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.corporate.value:
        raise HTTPException(403, "Only corporate users can upload documents")

    file_hash = compute_sha256(file)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    file_url = f"/uploads/{filename}"

    doc = crud.create_document(
        session=session,
        doc_type=doc_type.value,
        doc_number=doc_number,
        file_url=file_url,
        hash_value=file_hash,
        issued_at=issued_at,
        owner=current_user,
    )

    crud.create_ledger_entry(
        session, doc.id, "UPLOADED", "Document uploaded"
    )

    return {
        "message": "Document uploaded successfully",
        "id": doc.id,
        "doc_type": doc.doc_type,
        "doc_number": doc.doc_number,
        "hash": doc.hash,
        "file_url": doc.file_url,
    }


# -------------------- LIST DOCUMENTS --------------------
@router.get("/list", response_model=list[DocumentRead])
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    role = current_user.role

    if role == Role.auditor.value:
        docs = crud.list_all_documents(session)

    elif role in {Role.bank.value, Role.corporate.value}:
        docs = crud.list_documents_for_org(session, current_user.org_name)

    else:
        raise HTTPException(403, "Not authorized to view documents")

    for d in docs:
        crud.create_ledger_entry(
            session, d.id, "ACCESSED", "Document viewed in list"
        )

    return docs


# -------------------- GET BY HASH --------------------
@router.get("/by-hash/{hash_code}", response_model=DocumentRead)
def get_doc_by_hash(
    hash_code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    role = current_user.role

    if role == Role.auditor.value:
        doc = crud.get_document_by_hash(session, hash_code)

    elif role in {Role.bank.value, Role.corporate.value}:
        doc = crud.get_document_by_hash_and_org(
            session, hash_code, current_user.org_name
        )

    else:
        raise HTTPException(403, "Not allowed")

    if not doc:
        raise HTTPException(404, "Document not found")

    crud.create_ledger_entry(
        session, doc.id, "ACCESSED", "Accessed via hash"
    )

    return doc


# -------------------- VERIFY HASH --------------------
@router.post("/verify-hash")
def verify_document_hash(
    hash_code: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    calculated_hash = compute_sha256(file)

    is_match = calculated_hash == hash_code

    doc = None
    if is_match:
        doc = crud.get_document_by_hash(session, hash_code)

    if not is_match or not doc:
        return {
            "status": "failed",
            "message": "Provided hash does not match uploaded file or document not found",
            "provided_hash": hash_code,
            "calculated_hash": calculated_hash,
            "matched": False,
            "document_exists": bool(doc),
        }

    # ✅ Ledger entry
    crud.create_ledger_entry(
        session, doc.id, "VERIFIED", "Document hash verified"
    )

    return {
        "status": "success",
        "message": "Document hash verified successfully",
        "provided_hash": hash_code,
        "calculated_hash": calculated_hash,
        "matched": True,
        "document_exists": True,   # ✅ added
        "document_id": doc.id,
    }

# -------------------- UPDATE DOCUMENT --------------------
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
        raise HTTPException(403, "Only corporate can update documents")

    old_hash = doc.hash
    new_hash = compute_sha256(file)

    # ✅ Save new file
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    new_file_url = f"/uploads/{filename}"

    # ✅ Update DB
    doc.doc_type = doc_type.value
    doc.doc_number = doc_number
    doc.hash = new_hash
    doc.file_url = new_file_url

    session.add(doc)
    session.commit()
    session.refresh(doc)

    # ✅ Ledger entry
    crud.create_ledger_entry(
        session,
        doc.id,
        "MODIFIED",
        "Document updated",
        hash_before=old_hash,
        hash_after=new_hash,
    )

    return {
        "message": "Document updated successfully",
        "id": doc.id,
        "doc_type": doc.doc_type,
        "doc_number": doc.doc_number,
        "hash": doc.hash,
        "file_url": doc.file_url,
    }
