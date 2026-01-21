from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.dependencies import require_role
from app.services.risk_score_service import calculate_risk_score
from app.models.risk_score import RiskScore


router = APIRouter(
    prefix="/api/risk",
    tags=["Risk"],
    include_in_schema=False   # 🚫 HIDE ENTIRE ROUTER
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================================================
# 🔹 GET MY RISK SCORE
# ==================================================
@router.get("/me")
def my_risk_score(
    user=Depends(require_role("CORPORATE", "BANK", "ADMIN", "AUDITOR")),
    db: Session = Depends(get_db)
):
    user_id = int(user["sub"])

    risk = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()

    # Auto-calc if missing
    if not risk:
        return calculate_risk_score(user_id, db)

    return {
        "user_id": risk.user_id,
        "score": risk.score,
        "level": risk.level,
        "breakdown": risk.breakdown,
        "calculated_at": risk.calculated_at
    }


# ==================================================
# 🔹 ADMIN – ALL USERS RISK
# ==================================================
@router.get("/all")
def all_risk_scores(
    user=Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    risks = db.query(RiskScore).all()

    return [
        {
            "user_id": r.user_id,
            "score": r.score,
            "level": r.level,
            "calculated_at": r.calculated_at
        }
        for r in risks
    ]


# ==================================================
# 🔹 ADMIN – RECALCULATE USER
# ==================================================
@router.post("/recalculate/{user_id}")
def recalculate_risk(
    user_id: int,
    user=Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    result = calculate_risk_score(user_id, db)

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "Risk score recalculated",
        "result": result
    }
