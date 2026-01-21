import hashlib
from pathlib import Path
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.database import SessionLocal
from app import models


def calculate_file_hash(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


@celery_app.task
def integrity_check_task():
    db: Session = SessionLocal()

    # 🔥 BASE DIRECTORY = backend/
    BASE_DIR = Path(__file__).resolve().parents[2]
    UPLOAD_DIR = BASE_DIR / "uploaded_docs"

    documents = db.query(models.Document).all()

    for doc in documents:
        try:
            # Extract only filename from stored path / URL
            filename = Path(doc.file_url).name
            file_path = UPLOAD_DIR / filename

            # ✅ CASE 1: FILE IS MISSING
            if not file_path.exists():
                ledger = models.LedgerEntry(
                    document_id=doc.id,
                    action="INTEGRITY_FAILED",
                    actor_id=doc.owner_id,
                    meta_data={
                        "reason": "FILE_MISSING",
                        "expected_hash": doc.hash,
                        "file_path": str(file_path),
                    },
                )
                db.add(ledger)
                continue

            # ✅ CASE 2: FILE EXISTS → CHECK HASH
            actual_hash = calculate_file_hash(file_path)

            if actual_hash != doc.hash:
                ledger = models.LedgerEntry(
                    document_id=doc.id,
                    action="INTEGRITY_FAILED",
                    actor_id=doc.owner_id,
                    meta_data={
                        "reason": "HASH_MISMATCH",
                        "expected": doc.hash,
                        "actual": actual_hash,
                        "file_path": str(file_path),
                    },
                )
                db.add(ledger)

        except Exception as e:
            print(f"Integrity check failed for document {doc.id}: {e}")

    db.commit()
    db.close()
