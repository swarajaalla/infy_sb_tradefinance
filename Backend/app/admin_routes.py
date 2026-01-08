# Backend/app/admin_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
import hashlib
import logging

from app.database import get_db
from app.models import Document, IntegrityCheck, Alert, User
from app.auth.dependencies import get_current_user
from app.schema import AlertResponse, IntegrityCheckResponse, IntegritySummary
from app.s3 import s3_client, BUCKET_NAME

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

def require_admin_role(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# API 1: POST /admin/run-integrity-check
@router.post("/run-integrity-check", response_model=IntegrityCheckResponse)
def run_integrity_check(
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    if not force:
        recent_check = db.query(IntegrityCheck).filter(
            IntegrityCheck.check_type == "document_aws_comparison",
            IntegrityCheck.created_at >= datetime.utcnow() - timedelta(minutes=5),
            IntegrityCheck.status == "completed"
        ).first()
        if recent_check:
            return recent_check
    
    integrity_check = IntegrityCheck(
        check_type="document_aws_comparison",
        started_by=current_user.id,
        status="running",
        findings={}
    )
    db.add(integrity_check)
    db.commit()
    db.refresh(integrity_check)
    
    try:
        db_documents = db.query(Document).all()
        total_docs = len(db_documents)
        
        findings, errors, warnings, comparison_results = [], [], [], []
        verified = modified = no_url = access_errors = 0
        
        for doc in db_documents:
            doc_result = {
                "document_id": doc.id,
                "doc_number": doc.doc_number,
                "doc_type": doc.doc_type.value,
                "db_hash": doc.hash,
                "status": "pending",
                "details": {}
            }
            
            # Check 1: Document has a file URL
            if not doc.file_url or not doc.file_url.strip():
                no_url += 1
                doc_result["status"] = "error"
                doc_result["details"]["error"] = "No file URL in database"
                
                errors.append({
                    "category": "no_file_url",
                    "description": f"Document {doc.id} ({doc.doc_number}) has no file URL",
                    "severity": "high",
                    "document_id": doc.id,
                    "doc_number": doc.doc_number,
                    "doc_type": doc.doc_type.value
                })
                comparison_results.append(doc_result)
                continue
            
            # Check 2: URL follows expected S3 pattern
            if not doc.file_url.startswith(f"https://{BUCKET_NAME}.s3.amazonaws.com/"):
                access_errors += 1
                doc_result["status"] = "warning"
                doc_result["details"]["warning"] = f"Unexpected URL pattern: {doc.file_url}"
                
                warnings.append({
                    "category": "invalid_url_pattern",
                    "description": f"Document {doc.id} ({doc.doc_number}) has unexpected URL pattern",
                    "severity": "medium",
                    "document_id": doc.id,
                    "doc_number": doc.doc_number,
                    "doc_type": doc.doc_type.value,
                    "url": doc.file_url
                })
                comparison_results.append(doc_result)
                continue
            
            # Check 3: Compare database hash with AWS S3 file hash
            try:
                key = doc.file_url.replace(f"https://{BUCKET_NAME}.s3.amazonaws.com/", "")
                response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
                s3_file_content = response['Body'].read()
                s3_hash = hashlib.sha256(s3_file_content).hexdigest()
                
                if s3_hash == doc.hash:
                    verified += 1
                    doc_result["status"] = "verified"
                    doc_result["s3_hash"] = s3_hash
                    doc_result["details"]["message"] = "File matches database record"
                else:
                    modified += 1
                    doc_result["status"] = "modified"
                    doc_result["s3_hash"] = s3_hash
                    doc_result["details"]["message"] = "File has been modified"
                    doc_result["details"]["hash_mismatch"] = True
                    doc_result["details"]["db_hash_short"] = doc.hash[:16] + "..."
                    doc_result["details"]["s3_hash_short"] = s3_hash[:16] + "..."
                    
                    errors.append({
                        "category": "file_modified",
                        "description": f"Document {doc.id} ({doc.doc_number}) has been modified in AWS S3",
                        "severity": "critical",
                        "document_id": doc.id,
                        "doc_number": doc.doc_number,
                        "doc_type": doc.doc_type.value,
                        "db_hash_short": doc.hash[:16] + "...",
                        "s3_hash_short": s3_hash[:16] + "..."
                    })
                    
            except s3_client.exceptions.NoSuchKey:
                # Missing in AWS is counted as MODIFIED
                modified += 1
                doc_result["status"] = "modified"
                doc_result["details"]["error"] = "File not found in AWS S3 (Missing)"
                doc_result["details"]["message"] = "File missing in AWS S3"
                
                errors.append({
                    "category": "file_missing_in_aws",
                    "description": f"Document {doc.id} ({doc.doc_number}) not found in AWS S3",
                    "severity": "critical",
                    "document_id": doc.id,
                    "doc_number": doc.doc_number,
                    "doc_type": doc.doc_type.value,
                    "s3_url": doc.file_url
                })
                
            except Exception as e:
                access_errors += 1
                doc_result["status"] = "error"
                doc_result["details"]["error"] = f"AWS S3 access error: {str(e)}"
                
                warnings.append({
                    "category": "aws_access_error",
                    "description": f"Failed to access document {doc.id} ({doc.doc_number}) in AWS S3",
                    "severity": "medium",
                    "document_id": doc.id,
                    "doc_number": doc.doc_number,
                    "doc_type": doc.doc_type.value,
                    "error": str(e)
                })
            
            comparison_results.append(doc_result)
        
        # Add summary finding
        findings.append({
            "category": "document_aws_comparison",
            "description": f"Compared {total_docs} documents",
            "details": {
                "total_documents": total_docs,
                "verified": verified,
                "modified": modified,
                "no_url": no_url,
                "access_errors": access_errors,
                "comparison_results": comparison_results
            }
        })
        
        # Update integrity check with results
        integrity_check.status = "completed"
        integrity_check.findings = {
            "findings": findings,
            "errors": errors,
            "warnings": warnings,
            "summary": {
                "total_documents_checked": total_docs,
                "verified_documents": verified,
                "modified_documents": modified,
                "documents_without_url": no_url,
                "access_errors": access_errors,
                "check_timestamp": datetime.utcnow().isoformat()
            },
            "detailed_results": comparison_results
        }
        integrity_check.completed_at = datetime.utcnow()
        
        # Create alerts for any errors found
        if errors:
            for error in errors:
                alert = Alert(
                    title=f"Document Integrity Issue: {error.get('category', 'Unknown')}",
                    description=error.get('description', 'Unknown error'),
                    severity=error.get('severity', 'high'),
                    alert_type="document_integrity",
                    source=f"integrity_check:{integrity_check.id}",
                    alert_data=error
                )
                db.add(alert)
        
        db.commit()
        return integrity_check
        
    except Exception as e:
        integrity_check.status = "failed"
        integrity_check.findings = {"error": str(e)}
        db.commit()
        raise HTTPException(status_code=500, detail=f"Integrity check failed: {str(e)}")

# API 2: GET /admin/integrity-checks
@router.get("/integrity-checks", response_model=List[IntegrityCheckResponse])
def get_integrity_checks(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    return db.query(IntegrityCheck)\
        .order_by(IntegrityCheck.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()

# API 3: GET /admin/integrity-checks/summary
@router.get("/integrity-checks/summary", response_model=IntegritySummary)
def get_integrity_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    since_date = datetime.utcnow() - timedelta(days=days)
    
    status_counts = db.query(
        IntegrityCheck.status,
        func.count(IntegrityCheck.id)
    ).filter(IntegrityCheck.created_at >= since_date)\
     .group_by(IntegrityCheck.status).all()
    
    latest_check = db.query(IntegrityCheck)\
        .filter(IntegrityCheck.status == "completed")\
        .order_by(IntegrityCheck.completed_at.desc())\
        .first()
    
    checks = db.query(IntegrityCheck)\
        .filter(
            IntegrityCheck.status == "completed",
            IntegrityCheck.created_at >= since_date
        ).all()
    
    total_errors = total_warnings = 0
    for check in checks:
        if check.findings:
            total_errors += len(check.findings.get("errors", []))
            total_warnings += len(check.findings.get("warnings", []))
    
    avg_errors = total_errors / len(checks) if checks else 0
    avg_warnings = total_warnings / len(checks) if checks else 0
    
    summary_data = {
        "total_checks": sum(count for _, count in status_counts),
        "checks_by_status": {status: count for status, count in status_counts},
        "checks_by_type": {"document_aws_comparison": sum(count for _, count in status_counts)},
        "last_check_time": latest_check.completed_at if latest_check else None,
        "last_check_status": latest_check.status if latest_check else None,
        "average_findings": float(avg_errors + avg_warnings),
        "time_period_days": days
    }
    
    if latest_check and latest_check.findings:
        summary_data.update({
            "last_check_errors": len(latest_check.findings.get("errors", [])),
            "last_check_warnings": len(latest_check.findings.get("warnings", [])),
            "last_check_type": latest_check.check_type,
            "last_check_summary": latest_check.findings.get("summary", {})
        })
    
    return IntegritySummary(**summary_data)

# API 4: GET /admin/alerts
@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    alert_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    query = db.query(Alert)
    if severity: query = query.filter(Alert.severity == severity)
    if resolved is not None: query = query.filter(Alert.resolved == resolved)
    if alert_type: query = query.filter(Alert.alert_type == alert_type)
    
    return query.order_by(Alert.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()

# API 5: POST /admin/alerts/{alert_id}/acknowledge
@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return alert