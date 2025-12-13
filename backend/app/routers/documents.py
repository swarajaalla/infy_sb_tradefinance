from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..database import get_session
from ..models import User, Role
from ..schemas import DocumentCreate, DocumentRead
from ..auth import get_current_user
from .. import crud

router = APIRouter(prefix="/documents", tags=["Documents"])


def _normalize_role(role_value) -> str:
    """
    Accepts a Role enum or a string and returns a normalized lowercase string.
    """
    if hasattr(role_value, "value"):
        rv = role_value.value
    else:
        rv = str(role_value or "")
    return rv.lower().strip()


# CREATE — POST /documents/create
@router.post(
    "/create",
    response_model=dict,  # returns {"message": str, "document": DocumentRead}
    status_code=status.HTTP_201_CREATED,
    summary="Create Document",
)
def create_document(
    payload: DocumentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Any logged-in user can create a document **except auditors**.
    Allowed roles: admin, bank, corporate.
    """

    role_val = _normalize_role(getattr(current_user, "role", ""))

    # Allowed roles for creation
    allowed = {Role.admin.value, Role.bank.value, Role.corporate.value}
    # ensure allowed set contains lowercase strings
    allowed = {a.lower().strip() for a in allowed}

    if role_val not in allowed:
        # explicit 403 for auditors and any other non-allowed roles
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin, bank and corporate users can create documents",
        )

    doc = crud.create_document(
        session=session,
        title=payload.title,
        description=payload.description,
        doc_type=payload.doc_type,
        doc_number=payload.doc_number,
        file_url=payload.file_url,
        hash_value=payload.hash,
        owner=current_user,
    )

    return {"message": "Document created successfully", "document": doc}


# LIST — GET /documents/list
@router.get("/list", response_model=list[DocumentRead], summary="List Documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    - Admin & Auditor: see all documents
    - Others: only documents from their own org
    """
    role_val = _normalize_role(getattr(current_user, "role", ""))

    if role_val in {Role.admin.value.lower(), Role.auditor.value.lower()}:
        return crud.list_all_documents(session)

    if not current_user.org_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no organisation assigned",
        )

    return crud.list_documents_for_org(session, current_user.org_name)
