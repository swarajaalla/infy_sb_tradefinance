from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..schemas import IntegrityRunRequest
from ..database import get_session
from ..auth import get_current_user
from ..models import User, Role
from .. import crud

router = APIRouter(prefix="/integrity", tags=["Integrity"])


# --------------------------------------------------
# RUN INTEGRITY CHECK (ADMIN / AUDITOR ONLY)
# --------------------------------------------------
@router.post("/run")
def run_integrity_check(
    data: IntegrityRunRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        raise HTTPException(403, "Only admin or auditor can run integrity checks")

    result = crud.run_integrity_check(
        session=session,
        actor=current_user,
        document_ids=data.document_ids,
    )

    return result

# --------------------------------------------------
# GET INTEGRITY CHECK RECORDS (ADMIN / AUDITOR)
# --------------------------------------------------
@router.get("/checks")
def get_integrity_checks(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        raise HTTPException(403, "Access denied")

    return crud.get_integrity_checks(session, limit=limit)


# --------------------------------------------------
# GET INTEGRITY SUMMARY (ADMIN / AUDITOR)
# --------------------------------------------------
@router.get("/summary")
def get_integrity_summary(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        raise HTTPException(403, "Access denied")

    return crud.get_integrity_summary(session)


# --------------------------------------------------
# GET ACTIVE ALERTS (ADMIN / AUDITOR)
# --------------------------------------------------
@router.get("/alerts")
def get_integrity_alerts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        raise HTTPException(403, "Access denied")

    return crud.list_integrity_alerts(session)


# --------------------------------------------------
# ACKNOWLEDGE ALERT (ADMIN / AUDITOR)
# --------------------------------------------------
@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {Role.admin.value, Role.auditor.value}:
        raise HTTPException(403, "Access denied")

    alert = crud.acknowledge_integrity_alert(
        session=session,
        alert_id=alert_id,
        actor_id=current_user.id,
    )

    if not alert:
        raise HTTPException(404, "Alert not found")

    return {"message": "Alert acknowledged", "alert_id": alert.id}
