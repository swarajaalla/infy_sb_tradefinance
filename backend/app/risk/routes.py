from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import StringIO, BytesIO
import csv

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models
from app.risk.scoring import calculate_risk_score

router = APIRouter(prefix="/risk", tags=["Risk Analytics"])


# =====================================================
# OPTION A1: Get Risk for Single Trade
# =====================================================
@router.get("/trade/{trade_id}")
def get_trade_risk(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trade = db.query(models.TradeTransaction).filter(
        models.TradeTransaction.id == trade_id
    ).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    documents = db.query(models.Document).filter(
        models.Document.trade_id == trade_id
    ).all()

    ledger_entries = (
        db.query(models.LedgerEntry)
        .join(models.Document)
        .filter(models.Document.trade_id == trade_id)
        .all()
    )

    score, reasons = calculate_risk_score(
        trade, ledger_entries, documents
    )

    return {
        "trade_id": trade.id,
        "risk_score": score,
        "risk_level": (
            "LOW" if score < 30 else
            "MEDIUM" if score < 70 else
            "HIGH"
        ),
        "reasons": reasons,
    }


# =====================================================
# OPTION A2: Risk Summary (Dashboard)
# =====================================================
@router.get("/summary")
def risk_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trades = db.query(models.TradeTransaction).all()

    low = medium = high = 0
    total_score = 0
    counted = 0

    for trade in trades:
        documents = db.query(models.Document).filter(
            models.Document.trade_id == trade.id
        ).all()

        ledger_entries = (
            db.query(models.LedgerEntry)
            .join(models.Document)
            .filter(models.Document.trade_id == trade.id)
            .all()
        )

        try:
            score, _ = calculate_risk_score(
                trade, ledger_entries, documents
            )
        except Exception:
            continue

        counted += 1
        total_score += score

        if score < 30:
            low += 1
        elif score < 70:
            medium += 1
        else:
            high += 1

    return {
        "total_trades": len(trades),
        "low_risk": low,
        "medium_risk": medium,
        "high_risk": high,
        "average_risk_score": round(
            total_score / counted, 2
        ) if counted else 0,
    }


# =====================================================
# OPTION B: Export Risk Report (CSV)
# =====================================================
@router.get("/export/csv")
def export_risk_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trades = db.query(models.TradeTransaction).all()

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Trade ID",
        "Buyer ID",
        "Seller ID",
        "Amount",
        "Currency",
        "Risk Score",
        "Risk Level"
    ])

    for trade in trades:
        documents = db.query(models.Document).filter(
            models.Document.trade_id == trade.id
        ).all()

        ledger_entries = (
            db.query(models.LedgerEntry)
            .join(models.Document)
            .filter(models.Document.trade_id == trade.id)
            .all()
        )

        try:
            score, _ = calculate_risk_score(
                trade, ledger_entries, documents
            )
        except Exception:
            continue

        risk_level = (
            "LOW" if score < 30 else
            "MEDIUM" if score < 70 else
            "HIGH"
        )

        writer.writerow([
            trade.id,
            trade.buyer_id,
            trade.seller_id,
            trade.amount,
            trade.currency,
            score,
            risk_level
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=risk_report.csv"
        }
    )


# =====================================================
# OPTION C: Export Risk Report (PDF)
# =====================================================
@router.get("/export/pdf")
def export_risk_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trades = db.query(models.TradeTransaction).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Trade Risk Report", styles["Title"]))
    elements.append(Spacer(1, 0.3 * inch))

    table_data = [[
        "Trade ID",
        "Buyer",
        "Seller",
        "Amount",
        "Currency",
        "Risk Score",
        "Risk Level"
    ]]

    for trade in trades:
        documents = db.query(models.Document).filter(
            models.Document.trade_id == trade.id
        ).all()

        ledger_entries = (
            db.query(models.LedgerEntry)
            .join(models.Document)
            .filter(models.Document.trade_id == trade.id)
            .all()
        )

        try:
            score, _ = calculate_risk_score(
                trade, ledger_entries, documents
            )
        except Exception:
            continue

        risk_level = (
            "LOW" if score < 30 else
            "MEDIUM" if score < 70 else
            "HIGH"
        )

        table_data.append([
            trade.id,
            trade.buyer_id,
            trade.seller_id,
            trade.amount,
            trade.currency,
            score,
            risk_level
        ])

    table = Table(table_data, repeatRows=1)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=risk_report.pdf"
        }
    )
