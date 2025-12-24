from typing import List, Optional
from sqlmodel import Session, select
from . import models
from .auth import hash_password


# ---------- USERS ----------
def get_user_by_email(session: Session, email: str) -> Optional[models.User]:
    stmt = select(models.User).where(models.User.email == email)
    return session.exec(stmt).first()


def create_user(session: Session, name: str, email: str, password: str,
                role: models.Role, org_name: Optional[str] = None) -> models.User:
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
