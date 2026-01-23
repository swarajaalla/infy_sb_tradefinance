from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..schemas import IntegrityRunRequest
from ..database import get_session
from ..auth import get_current_user
from ..models import User, Role
from .. import crud
from app.tasks import run_integrity_task

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
    if current_user.role != Role.admin.value:
        raise HTTPException(403, "Only admin can run integrity checks")

    run_integrity_task.delay(
        actor_id=current_user.id,
        document_ids=data.document_ids,
    )

    return {
        "message": "Integrity check started in background"
    }

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

    alerts = crud.list_integrity_alerts(session)

    if not alerts:
        return {
            "message": "All integrity alerts have been acknowledged. No active issues.",
            "alerts": []
        }

    return {
        "message": "Active integrity alerts found",
        "count": len(alerts),
        "alerts": alerts
    }

# --------------------------------------------------
# ACKNOWLEDGE ALERT (ADMIN / AUDITOR)
# --------------------------------------------------
@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != Role.admin.value:
        raise HTTPException(403, "Access denied")

    alert = crud.acknowledge_integrity_alert(
        session=session,
        alert_id=alert_id,
        actor_id=current_user.id,
    )

    if not alert:
        raise HTTPException(404, "Alert not found")

    return {"message": "Alert acknowledged", "alert_id": alert.id}
