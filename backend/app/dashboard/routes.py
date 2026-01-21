from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total_docs = db.query(models.Document).count()
    verified_docs = db.query(models.LedgerEntry).count()
    total_trades = db.query(models.TradeTransaction).count()

    return {
        "documents": total_docs,
        "verified_documents": verified_docs,
        "trades": total_trades
    }
