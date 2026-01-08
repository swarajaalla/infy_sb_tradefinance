# Backend/app/document_routes.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import hashlib
import requests
import io
from app.models import UserRole

from typing import Optional
import logging
# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from app.database import get_db
from app.models import Document, User, DocumentType, Trade, TradeStatus
from app.schema import DocumentResponse, UpdateMode
from app.auth.dependencies import get_current_user
from app.s3 import upload_file_to_s3

router = APIRouter(prefix="/documents", tags=["Documents"])


# ------------------------------------------------
# Utility: SHA-256
# ------------------------------------------------
def generate_sha256_from_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def generate_sha256(file: UploadFile) -> str:
    file.file.seek(0)
    data = file.file.read()
    file.file.seek(0)
    return generate_sha256_from_bytes(data)


# ------------------------------------------------
# POST /documents
# Upload document (optionally linked to trade)
# ------------------------------------------------
@router.post("/", response_model=dict)
def create_document(
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    file: UploadFile = File(...),
    issued_at: Optional[str] = Form(None),
    trade_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Document upload request received from user: {current_user.email}")
    logger.info(f"doc_type: {doc_type}, doc_number: {doc_number}, trade_id: {trade_id}, issued_at: {issued_at}")
    
    try:
        # Convert doc_type to uppercase and validate
        doc_type_upper = doc_type.upper()
        logger.info(f"Uppercase doc_type: {doc_type_upper}")
        
        # Log available DocumentType values
        valid_types = [e.value for e in DocumentType]
        logger.info(f"Available document types: {valid_types}")
        
        # Handle different document type formats from frontend
        doc_type_mapping = {
            "INVOICE": DocumentType.INVOICE,
            "BL": DocumentType.BILL_OF_LADING,  # Frontend sends "BL"
            "LC": DocumentType.LOC,  # Frontend sends "LC"
            "CO": DocumentType.COO,  # Frontend sends "CO"
            "INSURANCE_CERT": DocumentType.INSURANCE_CERT,
        }
        
        if doc_type_upper in doc_type_mapping:
            doc_type_enum = doc_type_mapping[doc_type_upper]
            logger.info(f"Mapped {doc_type_upper} to {doc_type_enum}")
        else:
            # Try direct mapping
            doc_type_enum = DocumentType[doc_type_upper]
            logger.info(f"Direct mapping to {doc_type_enum}")
            
    except KeyError as e:
        logger.error(f"Invalid document type: {doc_type_upper}. Error: {e}")
        valid_types = [e.value for e in DocumentType]
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid document type '{doc_type_upper}'. Valid types: {valid_types}"
        )

    # Validate and parse trade_id
    trade = None
    trade_id_int = None
    if trade_id and trade_id.strip():
        try:
            trade_id_int = int(trade_id)
            logger.info(f"Looking for trade with ID: {trade_id_int}")
            trade = db.query(Trade).filter(Trade.id == trade_id_int).first()
            if not trade:
                logger.error(f"Trade not found with ID: {trade_id_int}")
                raise HTTPException(status_code=404, detail=f"Trade not found with ID: {trade_id_int}")

            logger.info(f"Found trade: {trade.id}, buyer: {trade.buyer_email}, seller: {trade.seller_email}")
            logger.info(f"Current user email: {current_user.email}")
            
            if current_user.email not in [trade.buyer_email, trade.seller_email]:
                logger.error(f"User {current_user.email} not authorized for trade {trade.id}")
                raise HTTPException(status_code=403, detail="Not allowed for this trade")
                
        except ValueError:
            logger.error(f"Invalid trade ID format: {trade_id}")
            raise HTTPException(status_code=400, detail="Invalid trade ID format. Must be a number")

    # Parse issued_at date
    issued_at_dt = None
    if issued_at and issued_at.strip():
        logger.info(f"Parsing issued_at: {issued_at}")
        try:
            # Try ISO format first
            issued_at_dt = datetime.fromisoformat(issued_at.replace('Z', '+00:00'))
            logger.info(f"Parsed as ISO format: {issued_at_dt}")
        except ValueError:
            try:
                # Try parsing as datetime-local format (YYYY-MM-DDTHH:MM)
                issued_at_dt = datetime.strptime(issued_at, "%Y-%m-%dT%H:%M")
                logger.info(f"Parsed as datetime-local format: {issued_at_dt}")
            except ValueError:
                logger.error(f"Invalid date format: {issued_at}")
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid date format. Use YYYY-MM-DDTHH:MM (e.g., 2024-01-01T14:30)"
                )

    # Read file and calculate hash
    try:
        logger.info(f"Reading file: {file.filename}, content-type: {file.content_type}")
        file_bytes = file.file.read()
        file_size = len(file_bytes)
        logger.info(f"File size: {file_size} bytes")
        file.file.seek(0)
        file_hash = generate_sha256_from_bytes(file_bytes)
        logger.info(f"File hash: {file_hash}")
    except Exception as e:
        logger.error(f"Failed to read file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Upload to S3
    try:
        logger.info("Uploading file to S3...")
        file_url = upload_file_to_s3(file)
        logger.info(f"File uploaded to: {file_url}")
    except Exception as e:
        logger.error(f"Failed to upload file to storage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")

    # Create document
    document = Document(
        owner_id=current_user.id,
        trade_id=trade_id_int,
        doc_type=doc_type_enum,
        doc_number=doc_number,
        file_url=file_url,
        hash=file_hash,
        issued_at=issued_at_dt,
    )

    try:
        logger.info(f"Creating document in database: {doc_number}, type: {doc_type_enum.value}")
        db.add(document)
        db.commit()
        db.refresh(document)
        logger.info(f"Document created with ID: {document.id}")
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail=f"Document number '{doc_number}' already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Auto-move trade → DOCUMENTS_UPLOADED
    if trade and trade.status == TradeStatus.SELLER_CONFIRMED:
        try:
            logger.info(f"Updating trade {trade.id} status to DOCUMENTS_UPLOADED")
            trade.status = TradeStatus.DOCUMENTS_UPLOADED
            trade.documents_uploaded_at = datetime.utcnow()
            db.commit()
            logger.info(f"Trade status updated successfully")
        except Exception as e:
            # Don't fail the document upload if trade update fails
            logger.error(f"Warning: Failed to update trade status: {str(e)}")

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "hash": document.hash,
        "doc_number": document.doc_number,
        "doc_type": document.doc_type.value,
    }

# ------------------------------------------------
# GET /documents
# ------------------------------------------------
@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = current_user.role.value

    query = db.query(Document, User.org_name).join(User)

    if role not in ["admin", "auditor"]:
        query = query.filter(User.org_name == current_user.org_name)

    docs = query.all()

    return [
        DocumentResponse(
            id=d.id,
            owner_id=d.owner_id,
            trade_id=d.trade_id,
            doc_type=d.doc_type.value,
            doc_number=d.doc_number,
            file_url=d.file_url,
            hash=d.hash,
            issued_at=d.issued_at,
            created_at=d.created_at,
            org_name=org,
        )
        for d, org in docs
    ]


# ------------------------------------------------
# GET /documents/hash/{hash_code}
# ------------------------------------------------
@router.get("/hash/{hash_code}", response_model=DocumentResponse)
def get_document_by_hash(
    hash_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).join(User).filter(Document.hash == hash_code).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    role = current_user.role.value
    if role not in ["admin", "auditor"] and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return DocumentResponse(
        id=doc.id,
        owner_id=doc.owner_id,
        trade_id=doc.trade_id,
        doc_type=doc.doc_type.value,
        doc_number=doc.doc_number,
        file_url=doc.file_url,
        hash=doc.hash,
        issued_at=doc.issued_at,
        created_at=doc.created_at,
        org_name=doc.owner.org_name,
    )


# ------------------------------------------------
# POST /documents/verify
# ------------------------------------------------
@router.post("/verify")
def verify_document(
    file: UploadFile = File(...),
    hash_code: str = Form(...),
    db: Session = Depends(get_db),
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
        "doc_number": doc.doc_number,
    }


# ------------------------------------------------
# PUT /documents/{document_id}/file
# ------------------------------------------------
@router.put("/{document_id}/file")
def update_document_file(
    document_id: int,
    mode: UpdateMode = Form(...),  # overwrite | append
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Fetch document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2️⃣ Check permissions: owner or admin
    if doc.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 3️⃣ Read new file content safely
    new_data = file.file.read()

    # 4️⃣ Handle overwrite or append
    if mode == UpdateMode.overwrite:
        final_data = new_data
    elif mode == UpdateMode.append:
        try:
            # Fetch existing file from S3
            response = requests.get(doc.file_url)
            response.raise_for_status()
            final_data = response.content + b"\n" + new_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read existing file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid mode")

    # 5️⃣ Prepare merged file for upload
    merged_file = UploadFile(
        filename=file.filename,
        file=io.BytesIO(final_data),
    )

    # 6️⃣ Upload to S3
    doc.file_url = upload_file_to_s3(merged_file)

    # 7️⃣ Update hash
    doc.hash = generate_sha256_from_bytes(final_data)

    # 8️⃣ Commit changes
    db.commit()
    db.refresh(doc)

    return {
        "message": f"Document {mode.value} successful",
        "document_id": doc.id,
        "new_hash": doc.hash,
    }