from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.trade import Trade
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.models.risk_score import RiskScore


def calculate_risk_score(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    score = 0
    breakdown = {}

    # -------------------------
    # 1️⃣ Verification Status
    # -------------------------
    docs = db.query(Document).filter(Document.uploaded_by == user_id).all()
    verified_docs = [
        d.id for d in docs
        if db.query(LedgerEntry)
        .filter(
            LedgerEntry.document_id == d.id,
            LedgerEntry.event_type == "HASH_VERIFIED"
        ).first()
    ]

    verification_score = min(len(verified_docs) * 5, 25)
    score += verification_score
    breakdown["verification"] = {
        "verified_docs": len(verified_docs),
        "score": verification_score
    }

    # -------------------------
    # 2️⃣ Trade History
    # -------------------------
    completed_trades = db.query(Trade).filter(
        (Trade.buyer_id == user_id) | (Trade.seller_id == user_id),
        Trade.status == "COMPLETED"
    ).count()

    trade_score = min(completed_trades * 5, 25)
    score += trade_score
    breakdown["trade_history"] = {
        "completed_trades": completed_trades,
        "score": trade_score
    }

    # -------------------------
    # 3️⃣ Recent Activity (30 days)
    # -------------------------
    last_30_days = datetime.utcnow() - timedelta(days=30)

    recent_activity = db.query(LedgerEntry).filter(
        LedgerEntry.performed_by == user_id,
        LedgerEntry.created_at >= last_30_days
    ).count()

    activity_score = min(recent_activity * 1.5, 15)
    score += activity_score
    breakdown["recent_activity"] = {
        "events_last_30_days": recent_activity,
        "score": round(activity_score, 1)
    }

    # -------------------------
    # 4️⃣ Account Age
    # -------------------------
    account_age_days = (datetime.utcnow() - user.created_at).days
    age_score = min(account_age_days / 30, 15)
    score += age_score
    breakdown["account_age"] = {
        "days": account_age_days,
        "score": round(age_score, 1)
    }

    # -------------------------
    # 5️⃣ Role Bonus
    # -------------------------
    role_bonus_map = {
        "ADMIN": 10,
        "BANK": 8,
        "AUDITOR": 5,
        "CORPORATE": 0
    }

    role_bonus = role_bonus_map.get(user.role, 0)
    score += role_bonus
    breakdown["role"] = {
        "role": user.role,
        "score": role_bonus
    }

    # -------------------------
    # 6️⃣ Penalties (Disputes)
    # -------------------------
    disputes = db.query(Trade).filter(
        (Trade.buyer_id == user_id) | (Trade.seller_id == user_id),
        Trade.status == "DISPUTED"
    ).count()

    penalty = min(disputes * 5, 20)
    score -= penalty
    breakdown["penalty"] = {
        "disputes": disputes,
        "score": -penalty
    }

    # -------------------------
    # Final Clamp
    # -------------------------
    final_score = max(0, min(round(score, 1), 100))

    if final_score >= 75:
        level = "LOW"
    elif final_score >= 45:
        level = "MEDIUM"
    else:
        level = "HIGH"

    breakdown["final"] = {
        "score": final_score,
        "level": level
    }

    # -------------------------
    # Save / Update
    # -------------------------
    existing = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()

    if existing:
        existing.score = final_score
        existing.level = level
        existing.breakdown = breakdown
        existing.calculated_at = datetime.utcnow()
    else:
        db.add(RiskScore(
            user_id=user_id,
            score=final_score,
            level=level,
            breakdown=breakdown
        ))

    db.commit()

    return {
        "user_id": user_id,
        "score": final_score,
        "level": level,
        "breakdown": breakdown
    }
