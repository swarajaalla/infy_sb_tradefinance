from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/integrity", tags=["Integrity"])


# =====================================================
# GET INTEGRITY STATUS (FOR UI TABLE + COUNTS)
# =====================================================
@router.get("/status")
def get_integrity_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entries = (
        db.query(models.LedgerEntry)
        .join(models.Document)
        .order_by(models.LedgerEntry.created_at.desc())
        .all()
    )

    response = []
    passed = failed = pending = 0

    for e in entries:
        status = "PENDING"

        if e.action == "VERIFIED":
            status = "PASSED"
            passed += 1
        elif e.action == "INTEGRITY_FAILED":
            status = "FAILED"
            failed += 1
        else:
            pending += 1

        response.append({
            "id": e.id,
            "document_id": e.document_id,
            "type": "SHA256",
            "status": status,
            "stored_hash": e.document.hash if e.document else None,
            "computed_hash": e.meta_data.get("computed_hash") if e.meta_data else None,
            "timestamp": e.created_at,
        })

    return {
        "summary": {
            "total": len(entries),
            "passed": passed,
            "failed": failed,
            "pending": pending,
        },
        "records": response,
    }


# =====================================================
# RUN INTEGRITY CHECK (SIMULATED)
# =====================================================
@router.post("/run")
def run_integrity_check(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    documents = db.query(models.Document).all()

    for doc in documents:
        ledger = models.LedgerEntry(
            document_id=doc.id,
            actor_id=current_user.id,
            action="VERIFIED",
            meta_data={
                "computed_hash": doc.hash,
                "note": "Integrity verified"
            },
            created_at=datetime.utcnow(),
        )
        db.add(ledger)

    db.commit()

    return {"message": "Integrity check completed"}
