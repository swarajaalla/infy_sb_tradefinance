# app/document_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, User, DocumentType
from app.schema import DocumentCreate, DocumentResponse
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["Documents"])


# -----------------------------------------------------
# POST /create_docs
# -----------------------------------------------------
@router.post("/create_docs")
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Validate document type string → Enum
    # Validate document type string → Enum
    try:
        # Try enum name first (case insensitive)
        doc_type_enum = DocumentType[data.doc_type.upper()]
    except KeyError:
        try:
            # Try enum value (exact match)
            doc_type_enum = DocumentType(data.doc_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document type")

    # Create document
    new_doc = Document(
        owner_id=current_user.id,
        doc_type=doc_type_enum,
        doc_number=data.doc_number,
        file_url=data.file_url,
        hash=data.hash,
        issued_at=data.issued_at
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "message": "Document created successfully",
        "doc_id": new_doc.id
    }


# -----------------------------------------------------
# GET /list_docs
# Admin + Auditor => all docs
# Corporate + Bank => only org docs
# -----------------------------------------------------
@router.get("/list_docs", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Fix role (enum or string)
    role = current_user.role.value if hasattr(current_user.role, "value") else current_user.role

    # Admin + Auditor → all documents
    if role in ["admin", "auditor"]:
        docs = (
            db.query(Document, User.org_name)
            .join(User, User.id == Document.owner_id)
            .all()
        )

    # Corporate / Bank → only their organization's documents
    else:
        docs = (
            db.query(Document, User.org_name)
            .join(User, User.id == Document.owner_id)
            .filter(User.org_name == current_user.org_name)
            .all()
        )

    result = []
    for doc, org in docs:
        result.append(
            DocumentResponse(
                id=doc.id,
                owner_id=doc.owner_id,
                doc_type=doc.doc_type.value,
                doc_number=doc.doc_number,
                file_url=doc.file_url,
                hash=doc.hash,
                issued_at=doc.issued_at,
                created_at=doc.created_at,
                org_name=org
            )
        )

    return result
