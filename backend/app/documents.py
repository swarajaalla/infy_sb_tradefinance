from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from .database import get_db
from .auth_utils import get_current_user # Interconnected with your security layer
from . import models
from .utils import compute_sha256_from_bytes
from .s3_config import upload_file_to_s3, generate_presigned_url

router = APIRouter(prefix="/documents", tags=["Digital Asset Management"])

# ======================================================
# ROLE PERMISSIONS (RBAC)
# ======================================================
# Defines exactly what Admin, Buyer, and Seller can do
ROLE_PERMISSIONS = {
    "admin":     {"upload": True,  "view": True, "verify": True,  "download": True},
    "buyer":     {"upload": True,  "view": True, "verify": False, "download": True},
    "seller":    {"upload": True,  "view": True, "verify": False, "download": True},
    "bank":      {"upload": False, "view": True, "verify": True,  "download": False},
}

def check_permission(user: models.User, action: str):
    """Enforces role-based access control for document actions."""
    role_name = user.role.value if hasattr(user.role, 'value') else str(user.role)
    perms = ROLE_PERMISSIONS.get(role_name)
    if not perms or not perms.get(action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Identity '{role_name}' is not authorized for this action.",
        )

# ======================================================
# 1. UPLOAD DOCUMENT
# ======================================================
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    doc_type: models.DocumentType = Form(...),
    doc_number: str = Form(...),
    trade_id: int = Form(None), # Critical: Links doc to Buyer/Seller trade
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    check_permission(current_user, "upload")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file payload")

    # Cryptographic Hashing for the Immutable Ledger
    file_hash = compute_sha256_from_bytes(file_bytes)
    s3_key = f"{current_user.org_id}/{uuid.uuid4()}_{file.filename}"

    # Storage Interconnection (AWS S3)
    stored_key = upload_file_to_s3(
        file_bytes=file_bytes,
        s3_key=s3_key,
        content_type=file.content_type,
    )

    document = models.Document(
        owner_id=current_user.id,
        org_id=current_user.org_id,
        trade_id=trade_id, 
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=stored_key,
        hash=file_hash,
        issued_at=datetime.now(timezone.utc),
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Automatically Record in Global Ledger
    db.add(
        models.LedgerEntry(
            document_id=document.id,
            action=models.LedgerAction.ISSUED,
            actor_id=current_user.id,
            extra_data={"filename": file.filename, "vault_key": stored_key},
        )
    )
    db.commit()

    return {"id": document.id, "hash": file_hash, "status": "SECURED"}

# ======================================================
# 2. LIST DOCUMENTS (ORGANIZATION ISOLATION)
# ======================================================
@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    check_permission(current_user, "view")

    query = db.query(models.Document)
    
    # Admins see global; Buyer/Seller see only their Org
    if current_user.role != models.UserRole.admin:
        query = query.filter(models.Document.org_id == current_user.org_id)

    documents = query.order_by(models.Document.created_at.desc()).all()

    return [
        {
            "id": doc.id,
            "type": doc.doc_type,
            "number": doc.doc_number,
            "trade_id": doc.trade_id,
            "date": doc.created_at,
        }
        for doc in documents
    ]