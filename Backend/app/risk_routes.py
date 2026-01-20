# Backend/app/risk_routes.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from datetime import datetime, timedelta
import logging
from decimal import Decimal

from app.database import get_db
from app.models import User, Trade, Document, RiskScore, TradeStatus
from app.schema import RiskScoreResponse, RiskRecalculateRequest, RiskRecalculateAllRequest
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/risk", tags=["Risk Scoring"])

logger = logging.getLogger(__name__)

def safe_float(value):
    """Convert any numeric type to float safely."""
    if value is None:
        return 0.0
    try:
        if isinstance(value, Decimal):
            return float(value)
        return float(value)
    except (ValueError, TypeError):
        return 0.0

# Helper function to calculate risk score
def calculate_user_risk_score(user_id: int, db: Session) -> RiskScore:
    """
    Calculate risk score for a user with proper error handling
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    base_score = 50.0
    factors = {}
    
    # Factor 1: Check if user is verified (with fallback if attribute doesn't exist)
    try:
        is_verified = getattr(user, 'is_verified', False)
        if is_verified:
            base_score += 20
            factors["verification"] = {"is_verified": True, "bonus": 20}
        else:
            base_score -= 5  # Reduced penalty for unverified
            factors["verification"] = {"is_verified": False, "penalty": -5}
    except AttributeError:
        # If is_verified doesn't exist, skip this factor
        factors["verification"] = {"error": "verification_status_not_available"}
    
    # Factor 2: Account age
    try:
        account_age_days = (datetime.utcnow() - user.created_at).days
        age_bonus = min(account_age_days, 365) * 0.05
        base_score += age_bonus
        factors["account_age"] = {"days": account_age_days, "bonus": age_bonus}
    except AttributeError:
        factors["account_age"] = {"error": "created_at_not_available"}
    
    # Factor 3: User role impact
    role_bonus = 0
    if hasattr(user, 'role'):
        if user.role.value == "admin":
            role_bonus = 25  # Admins are trusted
        elif user.role.value == "auditor":
            role_bonus = 20  # Auditors are trusted
        elif user.role.value == "bank":
            role_bonus = 15  # Banks are trusted
        elif user.role.value == "corporate":
            role_bonus = 0   # Corporates start neutral
        
        base_score += role_bonus
        factors["role"] = {"role": user.role.value, "bonus": role_bonus}
    
    # Factor 4: Trade history - FIXED QUERY
    try:
        # Count all trades for this user
        total_trades = db.query(Trade).filter(
            (Trade.buyer_email == user.email) | 
            (Trade.seller_email == user.email)
        ).count()
        
        if total_trades > 0:
            # Count completed trades - FIXED: Use correct status comparison
            completed_trades = db.query(Trade).filter(
                ((Trade.buyer_email == user.email) | (Trade.seller_email == user.email)) &
                (Trade.status == TradeStatus.COMPLETED)
            ).count()
            
            # Count disputed/cancelled trades - FIXED: Use correct status comparison
            problematic_trades = db.query(Trade).filter(
                ((Trade.buyer_email == user.email) | (Trade.seller_email == user.email)) &
                (Trade.status.in_([TradeStatus.DISPUTED, TradeStatus.CANCELLED]))
            ).count()
            
            completion_rate = (completed_trades / total_trades) * 100 if total_trades > 0 else 0
            problem_rate = (problematic_trades / total_trades) * 100 if total_trades > 0 else 0
            
            # Calculate trade score (0-30 points)
            trade_score = (completion_rate * 0.3) - (problem_rate * 0.5)
            base_score += trade_score
            
            factors["trade_history"] = {
                "total_trades": total_trades,
                "completed": completed_trades,
                "problematic": problematic_trades,
                "completion_rate": round(completion_rate, 2),
                "problem_rate": round(problem_rate, 2),
                "trade_score": round(trade_score, 2)
            }
        else:
            factors["trade_history"] = {"no_trades": True}
            
    except Exception as e:
        logger.error(f"Error calculating trade history for user {user_id}: {str(e)}", exc_info=True)
        factors["trade_history"] = {"error": "calculation_failed", "details": str(e)}
    
    # Factor 5: Document history - FIXED QUERY
    try:
        total_docs = db.query(Document).filter(Document.owner_id == user.id).count()
        
        if total_docs > 0:
            has_hash_docs = db.query(Document).filter(
                Document.owner_id == user.id,
                Document.hash.isnot(None)  # Alternative: count docs with hash
            ).count()
        
            doc_ratio = (has_hash_docs / total_docs) * 100 if total_docs > 0 else 0
            doc_score = doc_ratio * 0.2
            
            base_score += doc_score
            factors["document_history"] = {
                "total_documents": total_docs,
                "documents_with_hash": has_hash_docs,
                "hash_rate": round(doc_ratio, 2),
                "document_score": round(doc_score, 2)
            }
        else:
            factors["document_history"] = {"no_documents": True}
    except Exception as e:
        logger.error(f"Error calculating document history for user {user_id}: {str(e)}", exc_info=True)
        factors["document_history"] = {"error": "calculation_failed", "details": str(e)}
    
    # Factor 6: Recent activity (last 30 days) - FIXED: Use correct field name
    try:
        recent_trades = db.query(Trade).filter(
            ((Trade.buyer_email == user.email) | (Trade.seller_email == user.email)) &
            (Trade.initiated_at >= datetime.utcnow() - timedelta(days=30))
        ).count()
        
        recent_activity_score = min(recent_trades * 1.5, 15)  # Max 15 points
        base_score += recent_activity_score
        
        factors["recent_activity"] = {
            "trades_last_30_days": recent_trades,
            "activity_score": round(recent_activity_score, 2)
        }
    except Exception as e:
        logger.error(f"Error calculating recent activity for user {user_id}: {str(e)}", exc_info=True)
        factors["recent_activity"] = {"error": "calculation_failed", "details": str(e)}
    
    # Factor 7: Ledger activity (transparency score)
    try:
        from app.models import LedgerEntry
        ledger_entries = db.query(LedgerEntry).filter(
            LedgerEntry.actor_id == user.id
        ).count()
        
        ledger_score = min(ledger_entries * 0.5, 10)  # Max 10 points for transparency
        base_score += ledger_score
        factors["ledger_activity"] = {
            "total_entries": ledger_entries,
            "transparency_score": round(ledger_score, 2)
        }
    except Exception as e:
        logger.error(f"Error calculating ledger activity for user {user_id}: {str(e)}", exc_info=True)
        factors["ledger_activity"] = {"error": "calculation_failed", "details": str(e)}
    
    # Factor 8: Average trade value (if applicable) - FIXED: Convert Decimal to float
    try:
        user_trades = db.query(Trade).filter(
            (Trade.buyer_email == user.email) | 
            (Trade.seller_email == user.email)
        ).all()
        
        if user_trades:
            # Use safe_float to convert Decimal to float
            total_value = sum(safe_float(trade.amount) for trade in user_trades)
            avg_trade_value = total_value / len(user_trades)
            
            # Higher value trades get bonus (up to 10 points)
            value_score = min(avg_trade_value / 10000, 10)  # $10k = 1 point, $100k = 10 points max
            base_score += value_score  # Now value_score is float
            factors["trade_value"] = {
                "average_trade_value": round(avg_trade_value, 2),
                "value_score": round(value_score, 2)
            }
    except Exception as e:
        logger.error(f"Error calculating trade value for user {user_id}: {str(e)}", exc_info=True)
        # Don't add to factors if error occurs
    
    # Ensure score is between 0-100
    final_score = max(0, min(100, round(base_score, 2)))
    
    # Determine risk level
    if final_score >= 75:
        risk_level = "low"
    elif final_score >= 40:
        risk_level = "medium"
    else:
        risk_level = "high"
    
    # Check for existing risk score
    existing_score = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()
    
    if existing_score:
        existing_score.score = final_score
        existing_score.risk_level = risk_level
        existing_score.factors = factors
        existing_score.last_calculated = datetime.utcnow()
        existing_score.expires_at = datetime.utcnow() + timedelta(hours=24)
    else:
        existing_score = RiskScore(
            user_id=user_id,
            score=final_score,
            risk_level=risk_level,
            factors=factors,
            last_calculated=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(existing_score)
    
    try:
        db.commit()
        db.refresh(existing_score)
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving risk score for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save risk score")
    
    return existing_score


# -------------------------------------------------
# GET /risk/{user_id}
# -------------------------------------------------
@router.get("/{user_id}", response_model=RiskScoreResponse)
def get_user_risk_score(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get risk score for a specific user.
    Admin/Auditor can see any user's score.
    Regular users can only see their own score.
    """
    # Check permissions
    if current_user.role.value not in ["admin", "auditor"] and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own risk score"
        )
    
    try:
        risk_score = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()
        
        should_recalculate = False
        if not risk_score:
            should_recalculate = True
        elif risk_score.expires_at and risk_score.expires_at < datetime.utcnow():
            should_recalculate = True
        
        if should_recalculate:
            risk_score = calculate_user_risk_score(user_id, db)
        
        return RiskScoreResponse(
            user_id=risk_score.user_id,
            score=risk_score.score,
            risk_level=risk_score.risk_level,
            factors=risk_score.factors or {},
            last_calculated=risk_score.last_calculated,
            expires_at=risk_score.expires_at
        )
    except Exception as e:
        logger.error(f"Error getting risk score for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get risk score")


# -------------------------------------------------
# POST /risk/recalculate/{user_id}
# -------------------------------------------------
@router.post("/recalculate/{user_id}", response_model=RiskScoreResponse)
def recalculate_user_risk_score(
    user_id: int,
    request: RiskRecalculateRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Force recalculation of a user's risk score.
    Only admin/auditor can force recalculation for other users.
    """
    request = request or RiskRecalculateRequest()
    
    # Check permissions
    if current_user.role.value not in ["admin", "auditor"] and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only recalculate your own risk score"
        )
    
    try:
        risk_score = calculate_user_risk_score(user_id, db)
        
        logger.info(f"Risk score recalculated for user {user_id} by {current_user.email}")
        
        return RiskScoreResponse(
            user_id=risk_score.user_id,
            score=risk_score.score,
            risk_level=risk_score.risk_level,
            factors=risk_score.factors or {},
            last_calculated=risk_score.last_calculated,
            expires_at=risk_score.expires_at
        )
    except Exception as e:
        logger.error(f"Error recalculating risk score for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to recalculate risk score")


# -------------------------------------------------
# POST /risk/recalculate-all
# -------------------------------------------------
@router.post("/recalculate-all")
def recalculate_all_risk_scores(
    background_tasks: BackgroundTasks,
    request: RiskRecalculateAllRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recalculate risk scores for all users (background task).
    Only admin can trigger this.
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can recalculate all risk scores"
        )
    
    request = request or RiskRecalculateAllRequest()
    
    def _recalculate_all():
        """Background task to recalculate all scores"""
        try:
            users = db.query(User).all()
            total = len(users)
            
            logger.info(f"Starting batch recalculation for {total} users")
            
            success_count = 0
            error_count = 0
            
            for i, user in enumerate(users, 1):
                try:
                    calculate_user_risk_score(user.id, db)
                    success_count += 1
                    
                    if i % 10 == 0:
                        logger.info(f"Processed {i}/{total} users")
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error calculating risk for user {user.id}: {str(e)}")
            
            logger.info(f"Completed recalculation: {success_count} successful, {error_count} errors")
            
        except Exception as e:
            logger.error(f"Error in batch recalculation: {str(e)}")
    
    # Start background task
    background_tasks.add_task(_recalculate_all)
    
    return {
        "message": "Risk score recalculation started in background",
        "total_users": db.query(User).count(),
        "batch_size": request.batch_size,
        "status": "processing"
    }


# -------------------------------------------------
# GET /risk/ - Get All Risk Scores
# -------------------------------------------------
@router.get("/", response_model=list[RiskScoreResponse])
def get_all_risk_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all risk scores (admin/auditor only).
    """
    if current_user.role.value not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and auditor can view all risk scores"
        )
    
    try:
        risk_scores = db.query(RiskScore).order_by(desc(RiskScore.score)).all()
        
        return [
            RiskScoreResponse(
                user_id=score.user_id,
                score=score.score,
                risk_level=score.risk_level,
                factors=score.factors or {},
                last_calculated=score.last_calculated,
                expires_at=score.expires_at
            )
            for score in risk_scores
        ]
    except Exception as e:
        logger.error(f"Error getting all risk scores: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get risk scores")


# -------------------------------------------------
# GET /risk/me/score - Get My Risk Score
# -------------------------------------------------
@router.get("/me/score", response_model=RiskScoreResponse)
def get_my_risk_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's own risk score.
    """
    try:
        risk_score = db.query(RiskScore).filter(RiskScore.user_id == current_user.id).first()
        
        should_recalculate = False
        if not risk_score:
            should_recalculate = True
        elif risk_score.expires_at and risk_score.expires_at < datetime.utcnow():
            should_recalculate = True
        
        if should_recalculate:
            risk_score = calculate_user_risk_score(current_user.id, db)
        
        return RiskScoreResponse(
            user_id=risk_score.user_id,
            score=risk_score.score,
            risk_level=risk_score.risk_level,
            factors=risk_score.factors or {},
            last_calculated=risk_score.last_calculated,
            expires_at=risk_score.expires_at
        )
    except Exception as e:
        logger.error(f"Error getting own risk score for user {current_user.id}: {str(e)}")
        
        # Return a default response if calculation fails
        return RiskScoreResponse(
            user_id=current_user.id,
            score=50.0,
            risk_level="medium",
            factors={"error": "calculation_failed", "message": str(e)},
            last_calculated=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )


