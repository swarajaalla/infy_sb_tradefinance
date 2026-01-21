from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.database import get_session
from app.auth import get_current_user
from app import models

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

router = APIRouter(prefix="/risk", tags=["Risk"])


# -------------------- Helpers --------------------

def classify(score: float):
    if score >= 80:
        return "LOW", "green"
    elif score >= 50:
        return "MEDIUM", "orange"
    else:
        return "HIGH", "red"


def compute_user_metrics(user_id: int, db: Session):
    trades = db.exec(
        select(models.Trade).where(
            (models.Trade.buyer_id == user_id)
            | (models.Trade.seller_id == user_id)
            | (models.Trade.bank_id == user_id)
        )
    ).all()

    total_trades = len(trades)
    cancelled = len([t for t in trades if t.status == "CANCELLED"])
    disputed = len([t for t in trades if t.status == "DISPUTED"])

    documents = db.exec(
        select(models.Document).where(models.Document.owner_id == user_id)
    ).all()

    doc_ids = [d.id for d in documents]
    alerts = []
    if doc_ids:
        alerts = db.exec(
            select(models.IntegrityAlert).where(
                models.IntegrityAlert.document_id.in_(doc_ids)
            )
        ).all()

    return {
        "total_trades": total_trades,
        "cancelled_trades": cancelled,
        "disputed_trades": disputed,
        "integrity_alerts": len(alerts),
    }


def calculate_risk(user_id: int, db: Session):
    metrics = compute_user_metrics(user_id, db)

    internal = 100
    internal -= metrics["cancelled_trades"] * 20
    internal -= metrics["disputed_trades"] * 15
    internal = max(internal, 0)

    external = 75  # placeholder

    final = round((internal * 0.8) + (external * 0.2), 2)
    level, color = classify(final)

    return {
        "internal_score": internal,
        "external_score": external,
        "final_score": final,
        "level": level,
        "color": color,
        "metrics": metrics,
    }


# -------------------- Endpoints --------------------

@router.get("/me")
def my_risk(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    data = calculate_risk(current_user.id, db)
    return {
        "user_id": current_user.id,
        "final_score": data["final_score"],
        "level": data["level"],
        "color": data["color"],
        "message": "Risk is derived from your trade behavior and compliance history.",
    }


@router.get("/all")
def all_risks(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    if current_user.role not in ("admin", "auditor"):
        raise HTTPException(status_code=403, detail="Not permitted")

    users = db.exec(select(models.User)).all()
    rows = []

    for u in users:
        data = calculate_risk(u.id, db)
        rows.append({
            "user_id": u.id,
            "name": u.name,
            "role": u.role,
            "final_score": data["final_score"],
            "level": data["level"],
            "color": data["color"],
        })

    return rows


@router.get("/{user_id}")
def user_risk(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    if current_user.role not in ("admin", "auditor"):
        raise HTTPException(status_code=403, detail="Not permitted")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = calculate_risk(user_id, db)
    return {
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        **data,
        "last_updated": datetime.now(timezone.utc),
    }


@router.post("/recompute/{user_id}")
def recompute(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    if current_user.role not in ("admin", "auditor"):
        raise HTTPException(status_code=403, detail="Not permitted")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = calculate_risk(user_id, db)
    return {
        "user_id": user_id,
        **data,
        "recomputed_at": datetime.now(timezone.utc),
    }


@router.get("/export/pdf")
def export_risk_pdf(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    data = calculate_risk(current_user.id, db)
    styles = getSampleStyleSheet()
    path = "risk_report.pdf"

    elements = [
        Paragraph("<b>User Risk Report</b>", styles["Title"]),
        Spacer(1, 20),
        Paragraph(f"User ID: {current_user.id}", styles["Normal"]),
        Paragraph(f"Role: {current_user.role}", styles["Normal"]),
        Paragraph(f"Final Score: {data['final_score']}", styles["Normal"]),
        Paragraph(f"Risk Level: {data['level']}", styles["Normal"]),
        Spacer(1, 20),
    ]

    table_data = [
        ["Metric", "Value"],
        ["Total Trades", data["metrics"]["total_trades"]],
        ["Cancelled Trades", data["metrics"]["cancelled_trades"]],
        ["Disputed Trades", data["metrics"]["disputed_trades"]],
        ["Integrity Alerts", data["metrics"]["integrity_alerts"]],
    ]

    table = Table(table_data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))

    elements.append(table)

    doc = SimpleDocTemplate(path, pagesize=A4)
    doc.build(elements)

    return FileResponse(path, filename="risk_report.pdf")
