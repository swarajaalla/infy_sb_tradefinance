from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from datetime import datetime

from app.database import get_session
from app.auth import get_current_user
from app import models
from app.routers.risk import calculate_risk

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# -------------------- Helpers --------------------

def guard(user: models.User):
    if user.role not in ("admin", "auditor"):
        raise HTTPException(status_code=403, detail="Not permitted")


# -------------------- Endpoints --------------------

@router.get("/summary")
def summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    guard(current_user)

    users = db.exec(select(models.User)).all()
    trades = db.exec(select(models.Trade)).all()
    documents = db.exec(select(models.Document)).all()
    ledger = db.exec(select(models.Ledger)).all()

    completed = len([t for t in trades if t.status == "COMPLETED"])
    cancelled = len([t for t in trades if t.status == "CANCELLED"])
    pending = len([t for t in trades if t.status not in ("COMPLETED", "CANCELLED")])

    risks = [calculate_risk(u.id, db)["final_score"] for u in users]

    return {
        "users": {
            "total": len(users),
            "by_role": {
                "admin": len([u for u in users if u.role == "admin"]),
                "auditor": len([u for u in users if u.role == "auditor"]),
                "bank": len([u for u in users if u.role == "bank"]),
                "corporate": len([u for u in users if u.role == "corporate"]),
            },
        },
        "trades": {
            "total": len(trades),
            "completed": completed,
            "cancelled": cancelled,
            "pending": pending,
        },
        "documents_uploaded": len(documents),
        "ledger_events": len(ledger),
        "risk": {
            "average": round(sum(risks) / len(risks), 2) if risks else 0,
            "highest": max(risks) if risks else 0,
            "lowest": min(risks) if risks else 0,
        },
    }


@router.get("/risk-distribution")
def risk_distribution(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    guard(current_user)

    users = db.exec(select(models.User)).all()
    dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}

    for u in users:
        level = calculate_risk(u.id, db)["level"]
        dist[level] += 1

    return dist


@router.get("/trade-stats")
def trade_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    guard(current_user)

    trades = db.exec(select(models.Trade)).all()
    by_status = {}

    for t in trades:
        by_status[t.status] = by_status.get(t.status, 0) + 1

    return {
        "total": len(trades),
        "by_status": by_status,
    }


@router.get("/export/pdf")
def export_analytics_pdf(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    guard(current_user)

    users = db.exec(select(models.User)).all()
    trades = db.exec(select(models.Trade)).all()
    documents = db.exec(select(models.Document)).all()

    styles = getSampleStyleSheet()
    path = "analytics_report.pdf"

    # ---- Build risk table ----
    risk_rows = [["User ID", "Name", "Role", "Score", "Level"]]
    for u in users:
        r = calculate_risk(u.id, db)
        risk_rows.append([u.id, u.name, u.role, r["final_score"], r["level"]])

    risk_table = Table(risk_rows)
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))

    elements = [
        Paragraph("<b>Platform Analytics Report</b>", styles["Title"]),
        Spacer(1, 20),
        Paragraph(f"Generated on: {datetime.utcnow().isoformat()}", styles["Normal"]),
        Spacer(1, 20),

        Paragraph("<b>System Overview</b>", styles["Heading2"]),
        Paragraph(f"Total Users: {len(users)}", styles["Normal"]),
        Paragraph(f"Total Trades: {len(trades)}", styles["Normal"]),
        Paragraph(f"Documents Uploaded: {len(documents)}", styles["Normal"]),
        Spacer(1, 20),

        Paragraph("<b>User Risk Overview</b>", styles["Heading2"]),
        Spacer(1, 10),
        risk_table,
    ]

    doc = SimpleDocTemplate(path, pagesize=A4)
    doc.build(elements)

    return FileResponse(path, filename="analytics_report.pdf")
