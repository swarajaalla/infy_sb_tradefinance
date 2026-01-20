from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io

from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4

from app.database import get_db
from app.models import LedgerEntry, Document, Trade, RiskScore, User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

# --------------------------------------------------
# CSV RESPONSE UTILITY
# --------------------------------------------------
def csv_response(filename: str, headers: list, rows: list):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --------------------------------------------------
# ROLE HELPERS
# --------------------------------------------------
def is_admin_or_auditor(user: User):
    return user.role.value in ["admin", "auditor"]

# --------------------------------------------------
# TRADE QUERY BASED ON ROLE (FIXED)
# --------------------------------------------------
def trade_query_by_role(db: Session, user: User):
    if is_admin_or_auditor(user):
        return db.query(Trade)

    if user.role.value == "corporate":
        return db.query(Trade).filter(
            (Trade.buyer_email == user.email) |
            (Trade.seller_email == user.email)
        )

    if user.role.value == "bank":
        return db.query(Trade).filter(
            Trade.issuing_bank_id == user.id
        )

    raise HTTPException(status_code=403, detail="Access denied")

# ==================================================
# CSV EXPORTS
# ==================================================

@router.get("/csv/trades")
def export_trades_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trades = trade_query_by_role(db, current_user).all()

    rows = [
        [
            t.id,
            t.buyer_email,
            t.seller_email,
            float(t.amount),
            t.currency,
            t.status.value,
            t.initiated_at,
            t.completed_at
        ]
        for t in trades
    ]

    return csv_response(
        "trades.csv",
        ["Trade ID", "Buyer", "Seller", "Amount", "Currency", "Status", "Initiated At", "Completed At"],
        rows
    )

# --------------------------------------------------
@router.get("/csv/documents")
def export_documents_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trade_ids = [t.id for t in trade_query_by_role(db, current_user).all()]

    docs = db.query(Document).filter(Document.trade_id.in_(trade_ids)).all()

    rows = [
        [
            d.id,
            d.doc_type.value,
            d.doc_number,
            d.hash,
            d.trade_id,
            d.created_at
        ]
        for d in docs
    ]

    return csv_response(
        "documents.csv",
        ["ID", "Type", "Number", "Hash", "Trade ID", "Created At"],
        rows
    )

# --------------------------------------------------
@router.get("/csv/ledger")
def export_ledger_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trade_ids = [t.id for t in trade_query_by_role(db, current_user).all()]

    entries = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.trade_id.in_(trade_ids))
        .order_by(LedgerEntry.created_at.asc())
        .all()
    )

    rows = [
        [
            e.id,
            e.trade_id,
            e.document_id,
            e.action.value,
            e.actor_id,
            e.created_at
        ]
        for e in entries
    ]

    return csv_response(
        "ledger_entries.csv",
        ["ID", "Trade ID", "Document ID", "Action", "Actor ID", "Timestamp"],
        rows
    )

# --------------------------------------------------
@router.get("/csv/risk")
def export_risk_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin_or_auditor(current_user):
        raise HTTPException(status_code=403, detail="Only admin/auditor can view risk scores")

    scores = db.query(RiskScore).all()

    rows = [
        [
            r.user_id,
            r.score,
            r.risk_level,
            r.last_calculated,
            r.expires_at
        ]
        for r in scores
    ]

    return csv_response(
        "risk_scores.csv",
        ["User ID", "Score", "Risk Level", "Calculated At", "Expires At"],
        rows
    )

# ==================================================
# PDF EXPORTS
# ==================================================

@router.get("/pdf/trade/{trade_id}")
def export_trade_pdf(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trade = (
        trade_query_by_role(db, current_user)
        .filter(Trade.id == trade_id)
        .first()
    )

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found or access denied")

    ledger_entries = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.trade_id == trade_id)
        .order_by(LedgerEntry.created_at.asc())
        .all()
    )

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Trade Lifecycle Summary</b>", styles["Title"]))
    story.append(Paragraph(f"Trade ID: {trade.id}", styles["Normal"]))
    story.append(Paragraph(f"Buyer: {trade.buyer_email}", styles["Normal"]))
    story.append(Paragraph(f"Seller: {trade.seller_email}", styles["Normal"]))
    story.append(Paragraph(f"Issuing Bank ID: {trade.issuing_bank_id}", styles["Normal"]))
    story.append(Paragraph(f"Amount: {trade.amount} {trade.currency}", styles["Normal"]))
    story.append(Paragraph(f"Status: {trade.status.value}", styles["Normal"]))
    story.append(Paragraph("<br/>", styles["Normal"]))

    story.append(Paragraph("<b>Ledger Timeline</b>", styles["Heading2"]))

    for e in ledger_entries:
        story.append(
            Paragraph(
                f"{e.created_at} — {e.action.value} (Actor ID: {e.actor_id})",
                styles["Normal"]
            )
        )

    pdf.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=trade_{trade_id}.pdf"}
    )

@router.get("/pdf/document/{document_id}")
def export_document_pdf(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Step 1: find trades user is allowed to see
    trade_ids = [
        t.id for t in trade_query_by_role(db, current_user).all()
    ]

    # Step 2: fetch document ONLY if it belongs to allowed trades
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.trade_id.in_(trade_ids)
        )
        .first()
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found or access denied"
        )

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Document Verification Report</b>", styles["Title"]))
    story.append(Paragraph(f"Document ID: {doc.id}", styles["Normal"]))
    story.append(Paragraph(f"Document Type: {doc.doc_type.value}", styles["Normal"]))
    story.append(Paragraph(f"Document Number: {doc.doc_number}", styles["Normal"]))
    story.append(Paragraph(f"Trade ID: {doc.trade_id}", styles["Normal"]))
    story.append(Paragraph(f"Owner ID: {doc.owner_id}", styles["Normal"]))
    story.append(Paragraph("<br/>", styles["Normal"]))

    story.append(Paragraph("<b>Stored Hash (Integrity)</b>", styles["Heading2"]))
    story.append(Paragraph(doc.hash, styles["Code"]))

    pdf.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=document_{document_id}.pdf"
        }
    )
