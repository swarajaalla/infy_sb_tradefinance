from typing import List, Optional
import uuid,os,hashlib
from datetime import datetime
from sqlmodel import Session, select
from . import models
from .auth import hash_password
from .models import (
    User,
    Document,
    Ledger,
    Trade,
    Role,
    TradeStatus,IntegrityCheck, IntegrityStatus, IntegrityAlert,
)

# ================= USERS =================

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(
        select(User).where(User.email == email)
    ).first()


def create_user(
    session: Session,
    name: str,
    email: str,
    password: str,
    role: models.Role,
    org_name: Optional[str] = None,
) -> User:
    user = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        org_name=org_name,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def list_users(session: Session) -> List[User]:
    return session.exec(select(User)).all()


# ================= DOCUMENTS =================

def create_document(
    session: Session,
    trade_id: int,
    doc_type: str,
    doc_number: str,
    file_url: str,
    hash_value: str,
    issued_at,
    owner: User,
) -> Document:
    doc = Document(
        trade_id=trade_id, 
        owner_id=owner.id,
        org_name=owner.org_name,
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=file_url,
        hash=hash_value,
        issued_at=issued_at,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


def list_all_documents(session: Session) -> List[Document]:
    return session.exec(select(Document)).all()


def list_documents_for_org(session: Session, org_name: str) -> List[Document]:
    return session.exec(
        select(Document).where(Document.org_name == org_name)
    ).all()


def get_document_by_id(session: Session, doc_id: int) -> Optional[Document]:
    return session.get(Document, doc_id)


def get_document_by_hash(session: Session, hash_code: str) -> Optional[Document]:
    return session.exec(
        select(Document).where(Document.hash == hash_code)
    ).first()


def get_document_by_hash_and_org(
    session: Session, hash_code: str, org_name: str
) -> Optional[Document]:
    return session.exec(
        select(Document).where(
            Document.hash == hash_code,
            Document.org_name == org_name,
        )
    ).first()


# ================= LEDGER (DOCUMENT) =================

def create_ledger_entry(
    session: Session,
    document_id: int,
    actor: User,
    event_type: str,
    description: str,
    hash_before: Optional[str] = None,
    hash_after: Optional[str] = None,
):
    ledger = Ledger(
        document_id=document_id,
        actor_id=actor.id,
        org_name=actor.org_name,
        event_type=event_type,
        description=description,
        hash_before=hash_before,
        hash_after=hash_after,
    )
    session.add(ledger)
    session.commit()
    session.refresh(ledger)
    return ledger

# ================= LEDGER HELPERS =================

def list_ledger_entries_by_org(session: Session, org_name: str):
    return session.exec(
        select(Ledger).where(Ledger.org_name == org_name)
    ).all()


def list_all_ledger_entries(session: Session):
    return session.exec(
        select(Ledger).order_by(Ledger.timestamp.desc())
    ).all()

# ================= TRADES =================

def log_trade_event(
    session: Session,
    trade: Trade,
    actor: User,
    status: str,
    remarks: str,
):
    ledger = Ledger(
        document_id=trade.id,   # trade_id reused as document_id
        actor_id=actor.id,
        org_name=actor.org_name,
        event_type=status,
        description=remarks,
    )
    session.add(ledger)


def create_trade(
    session: Session,
    buyer_id: int,
    seller_id: int,
    description: str,
    amount: float,
    currency: str,
):
    trade = Trade(
        trade_number=f"TRD-{uuid.uuid4().hex[:8].upper()}",
        buyer_id=buyer_id,
        seller_id=seller_id,
        description=description,
        amount=amount,
        currency=currency,
        status=TradeStatus.INITIATED,
        created_at=datetime.utcnow(),
    )

    session.add(trade)
    session.commit()
    session.refresh(trade)

    buyer = session.get(User, buyer_id)

    log_trade_event(
        session=session,
        trade=trade,
        actor=buyer,
        status=TradeStatus.INITIATED,
        remarks="Trade initiated by buyer",
    )

    session.commit()
    return trade


def update_trade_status(
    session: Session,
    trade: Trade,
    actor: User,
    new_status: str,
    remarks: str,
):
    trade.status = new_status
    trade.updated_at = datetime.utcnow() 
    if new_status == TradeStatus.COMPLETED:
        trade.completed_at = datetime.utcnow()

    log_trade_event(
        session=session,
        trade=trade,
        actor=actor,
        status=new_status,
        remarks=remarks,
    )

    session.add(trade)
    session.commit()
    session.refresh(trade)
    return trade


def assign_bank_to_trade(
    session: Session,
    trade: Trade,
    bank: User,
    actor: User,
):
    trade.bank_id = bank.id
    trade.status = TradeStatus.BANK_ASSIGNED

    log_trade_event(
        session=session,
        trade=trade,
        actor=actor,
        status=TradeStatus.BANK_ASSIGNED,
        remarks=f"Bank {bank.email} assigned to trade",
    )

    session.add(trade)
    session.commit()
    session.refresh(trade)
    return trade


# ================= TRADE READ HELPERS =================

def get_trade_by_id(session: Session, trade_id: int) -> Optional[Trade]:
    return session.get(Trade, trade_id)


def list_trades_for_user(session: Session, user: User):
    if user.role in {Role.admin.value, Role.auditor.value}:
        return session.exec(select(Trade)).all()

    if user.role == Role.bank.value:
        return session.exec(
            select(Trade).where(Trade.bank_id == user.id)
        ).all()

    return session.exec(
        select(Trade).where(
            (Trade.buyer_id == user.id) |
            (Trade.seller_id == user.id)
        )
    ).all()

# ================= INTEGRITY CHECK =================

def compute_file_hash(file_path: str) -> str:
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def run_integrity_check(session, actor, document_ids=None):
    """
    Runs integrity check on all documents or specific ones.
    Returns summary: passed / failed / pending.
    """

    if document_ids:
        docs = session.exec(
            select(Document).where(Document.id.in_(document_ids))
        ).all()
    else:
        docs = session.exec(select(Document)).all()

    passed = failed = pending = 0
    results = []

    for doc in docs:
        stored_hash = doc.hash
        computed_hash = None
        status = IntegrityStatus.PENDING

        try:
            if not doc.file_url:
                status = IntegrityStatus.PENDING
            else:
                file_path = doc.file_url.replace("/uploads/", "uploads/")
                if not os.path.exists(file_path):
                    status = IntegrityStatus.PENDING
                else:
                    computed_hash = compute_file_hash(file_path)
                    if computed_hash == stored_hash:
                        status = IntegrityStatus.PASSED
                    else:
                        status = IntegrityStatus.FAILED
        except Exception:
            status = IntegrityStatus.PENDING

        check = IntegrityCheck(
            document_id=doc.id,
            stored_hash=stored_hash,
            computed_hash=computed_hash,
            status=status,
            check_type="SHA256",
        )
        session.add(check)
        session.commit()
        session.refresh(check)

        if status == IntegrityStatus.PASSED:
            passed += 1
        elif status == IntegrityStatus.FAILED:
            failed += 1

            # Create alert
            alert = IntegrityAlert(
                document_id=doc.id,
                integrity_check_id=check.id,
                message="Integrity check failed. Possible tampering or missing file.",
            )
            session.add(alert)

            # Create ledger entry (legal audit trail)
            ledger = Ledger(
                document_id=doc.id,
                actor_id=actor.id,
                org_name=actor.org_name,
                event_type="INTEGRITY_FAILED",
                description="Integrity check failed for document",
                hash_before=stored_hash,
                hash_after=computed_hash,
            )
            session.add(ledger)

            session.commit()

        else:
            pending += 1

        results.append(check)

    return {
        "total": len(docs),
        "passed": passed,
        "failed": failed,
        "pending": pending,
        "results": results,
    }


def get_integrity_checks(session, limit=100):
    return session.exec(
        select(IntegrityCheck).order_by(IntegrityCheck.created_at.desc()).limit(limit)
    ).all()


def get_integrity_summary(session):
    checks = session.exec(select(IntegrityCheck)).all()

    passed = len([c for c in checks if c.status == IntegrityStatus.PASSED])
    failed = len([c for c in checks if c.status == IntegrityStatus.FAILED])
    pending = len([c for c in checks if c.status == IntegrityStatus.PENDING])

    return {
        "total": len(checks),
        "passed": passed,
        "failed": failed,
        "pending": pending,
    }


def list_integrity_alerts(session):
    return session.exec(
        select(IntegrityAlert).where(IntegrityAlert.acknowledged == False)
    ).all()


def acknowledge_integrity_alert(session, alert_id: int, actor_id: int):
    alert = session.get(IntegrityAlert, alert_id)
    if not alert:
        return None

    alert.acknowledged = True
    alert.acknowledged_by = actor_id
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert
