from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session
from datetime import datetime
import hashlib, os, uuid

from ..database import get_session
from ..models import User, Role
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


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Only Corporate
    if current_user.role != Role.corporate.value:
        raise HTTPException(
            status_code=403,
            detail="Only corporate users are allowed to upload trade documents",
        )

    file_hash = compute_sha256(file)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    file_url = f"/uploads/{filename}"

    doc = crud.create_document(
        session=session,
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=file_url,
        hash_value=file_hash,
        issued_at=issued_at,
        owner=current_user,
    )

    return {"message": "Document uploaded successfully"}

@router.get("/list", response_model=list[DocumentRead])
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    role = current_user.role

    if role == Role.auditor.value:
        return crud.list_all_documents(session)

    if role in {Role.bank.value, Role.corporate.value}:
        return crud.list_documents_for_org(session, current_user.org_name)

    raise HTTPException(
        status_code=403,
        detail="You are not authorized to view trade documents",
    )
