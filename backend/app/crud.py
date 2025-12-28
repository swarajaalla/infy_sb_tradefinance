from typing import List, Optional
from sqlmodel import Session, select
from . import models
from .auth import hash_password
from .models import Ledger, Document


# ---------- USERS ----------
def get_user_by_email(session: Session, email: str) -> Optional[models.User]:
    stmt = select(models.User).where(models.User.email == email)
    return session.exec(stmt).first()


def create_user(
    session: Session,
    name: str,
    email: str,
    password: str,
    role: models.Role,
    org_name: Optional[str] = None,
) -> models.User:
    user = models.User(
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


def list_users(session: Session) -> List[models.User]:
    return session.exec(select(models.User)).all()


# ---------- DOCUMENT ----------
def create_document(
    session: Session,
    doc_type: str,
    doc_number: str,
    file_url: str,
    hash_value: str,
    issued_at,
    owner: models.User,
) -> models.Document:
    doc = models.Document(
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


def list_all_documents(session: Session) -> List[models.Document]:
    return session.exec(select(models.Document)).all()


def list_documents_for_org(session: Session, org_name: str) -> List[models.Document]:
    stmt = select(models.Document).where(models.Document.org_name == org_name)
    return session.exec(stmt).all()


def get_document_by_id(session: Session, doc_id: int):
    return session.get(Document, doc_id)


def get_document_by_hash(session: Session, hash_code: str):
    stmt = select(Document).where(Document.hash == hash_code)
    return session.exec(stmt).first()


def get_document_by_hash_and_org(
    session: Session, hash_code: str, org_name: str
):
    stmt = select(Document).where(
        Document.hash == hash_code,
        Document.org_name == org_name,
    )
    return session.exec(stmt).first()


# ---------- LEDGER ----------
def create_ledger_entry(
    session: Session,
    document_id: int,
    event_type: str,
    description: Optional[str] = None,
    hash_before: Optional[str] = None,
    hash_after: Optional[str] = None,
):
    entry = Ledger(
        document_id=document_id,
        event_type=event_type,
        description=description,
        hash_before=hash_before,
        hash_after=hash_after,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def list_ledger_entries(session: Session):
    return session.exec(select(Ledger)).all()


def get_ledger_entry(session: Session, entry_id: int):
    return session.get(Ledger, entry_id)


def get_document_ledger_entries(session: Session, document_id: int):
    stmt = select(Ledger).where(Ledger.document_id == document_id)
    return session.exec(stmt).all()


def ledger_stats(session: Session):
    entries = session.exec(select(Ledger)).all()
    stats = {}
    for e in entries:
        stats[e.event_type] = stats.get(e.event_type, 0) + 1
    return {
        "total": len(entries),
        "by_type": stats,
    }
