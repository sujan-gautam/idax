"""
Admin Routes - Complete Admin Panel API
Handles user management, feature flags, quotas, audit logs, and system statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import bcrypt

from ..database import get_db
from ..auth import get_current_user, require_admin
from ..models import User, Tenant, FeatureFlags, Quotas, AuditLog, ApiKey, Project, Dataset, Upload, Job, AiUsage

router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None
    password: str
    role: str = "MEMBER"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None

class QuotasUpdate(BaseModel):
    maxProjects: Optional[int] = None
    maxStorageBytes: Optional[int] = None
    maxUploadsPerMonth: Optional[int] = None
    maxApiCallsPerMonth: Optional[int] = None
    maxAiTokensPerMonth: Optional[int] = None

class FeatureFlagsUpdate(BaseModel):
    flags: dict

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users in tenant with pagination and filters"""
    tenant_id = current_user["tenantId"]
    skip = (page - 1) * limit
    
    query = db.query(User).filter(User.tenantId == tenant_id)
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.name.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "status": u.status,
                "createdAt": u.createdAt,
                "lastLoginAt": u.lastLoginAt
            }
            for u in users
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get user by ID with audit logs"""
    tenant_id = current_user["tenantId"]
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenantId == tenant_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent audit logs
    audit_logs = db.query(AuditLog).filter(
        AuditLog.actorUserId == user_id
    ).order_by(AuditLog.createdAt.desc()).limit(10).all()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "createdAt": user.createdAt,
        "lastLoginAt": user.lastLoginAt,
        "auditLogs": [
            {
                "id": log.id,
                "action": log.action,
                "entityType": log.entityType,
                "createdAt": log.createdAt
            }
            for log in audit_logs
        ]
    }

@router.post("/users", status_code=201)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    tenant_id = current_user["tenantId"]
    
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        passwordHash=password_hash,
        role=user_data.role,
        tenantId=tenant_id,
        status="ACTIVE"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="USER_CREATED",
        entityType="User",
        entityId=new_user.id,
        diffJson={"email": user_data.email, "role": user_data.role}
    )
    db.add(audit)
    db.commit()
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role,
        "status": new_user.status,
        "createdAt": new_user.createdAt
    }

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user details"""
    tenant_id = current_user["tenantId"]
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenantId == tenant_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.status is not None:
        user.status = user_data.status
    
    db.commit()
    db.refresh(user)
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="USER_UPDATED",
        entityType="User",
        entityId=user_id,
        diffJson=user_data.dict(exclude_none=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "createdAt": user.createdAt,
        "lastLoginAt": user.lastLoginAt
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    tenant_id = current_user["tenantId"]
    
    # Prevent self-deletion
    if user_id == current_user["userId"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenantId == tenant_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email = user.email
    db.delete(user)
    db.commit()
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="USER_DELETED",
        entityType="User",
        entityId=user_id,
        diffJson={"email": email}
    )
    db.add(audit)
    db.commit()
    
    return {"success": True}

# ============================================================================
# FEATURE FLAGS MANAGEMENT
# ============================================================================

@router.get("/feature-flags")
async def get_feature_flags(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all feature flags for tenant"""
    tenant_id = current_user["tenantId"]
    
    flags = db.query(FeatureFlags).filter(FeatureFlags.tenantId == tenant_id).first()
    
    if not flags:
        # Create default flags
        default_flags = {
            "autoEDA": True,
            "distributions": True,
            "correlations": True,
            "outliers": True,
            "quality": True,
            "advancedCleansing": False,
            "aiAssistant": True,
            "apiAccess": False,
            "customBranding": False,
            "ssoEnabled": False,
            "auditLogs": True,
            "dataExport": True,
            "scheduledReports": False,
            "webhooks": False,
            "advancedAnalytics": False
        }
        
        flags = FeatureFlags(
            tenantId=tenant_id,
            flagsJson=default_flags
        )
        db.add(flags)
        db.commit()
        db.refresh(flags)
    
    return {
        "id": flags.id,
        "tenantId": flags.tenantId,
        "flagsJson": flags.flagsJson,
        "updatedAt": flags.updatedAt
    }

@router.put("/feature-flags")
async def update_feature_flags(
    flags_data: FeatureFlagsUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update feature flags"""
    tenant_id = current_user["tenantId"]
    
    flags = db.query(FeatureFlags).filter(FeatureFlags.tenantId == tenant_id).first()
    
    if flags:
        flags.flagsJson = flags_data.flags
    else:
        flags = FeatureFlags(
            tenantId=tenant_id,
            flagsJson=flags_data.flags
        )
        db.add(flags)
    
    db.commit()
    db.refresh(flags)
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="FEATURE_FLAGS_UPDATED",
        entityType="FeatureFlags",
        entityId=flags.id,
        diffJson=flags_data.flags
    )
    db.add(audit)
    db.commit()
    
    return {
        "id": flags.id,
        "tenantId": flags.tenantId,
        "flagsJson": flags.flagsJson,
        "updatedAt": flags.updatedAt
    }

# ============================================================================
# TENANT MANAGEMENT
# ============================================================================

@router.get("/tenant")
async def get_tenant(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get tenant details with counts"""
    tenant_id = current_user["tenantId"]
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get counts
    user_count = db.query(User).filter(User.tenantId == tenant_id).count()
    project_count = db.query(Project).filter(Project.tenantId == tenant_id).count()
    dataset_count = db.query(Dataset).filter(Dataset.tenantId == tenant_id).count()
    upload_count = db.query(Upload).filter(Upload.tenantId == tenant_id).count()
    job_count = db.query(Job).filter(Job.tenantId == tenant_id).count()
    
    # Get quotas
    quotas = db.query(Quotas).filter(Quotas.tenantId == tenant_id).first()
    
    # Get feature flags
    feature_flags = db.query(FeatureFlags).filter(FeatureFlags.tenantId == tenant_id).first()
    
    # Get AI usage
    ai_usage = db.query(AiUsage).filter(AiUsage.tenantId == tenant_id).first()
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "plan": tenant.plan,
        "status": tenant.status,
        "createdAt": tenant.createdAt,
        "quotas": {
            "maxProjects": quotas.maxProjects if quotas else 5,
            "maxStorageBytes": str(quotas.maxStorageBytes) if quotas else "1073741824",
            "maxUploadsPerMonth": quotas.maxUploadsPerMonth if quotas else 50,
            "maxApiCallsPerMonth": quotas.maxApiCallsPerMonth if quotas else 1000,
            "maxAiTokensPerMonth": quotas.maxAiTokensPerMonth if quotas else 50000
        } if quotas else None,
        "featureFlags": feature_flags.flagsJson if feature_flags else {},
        "aiUsage": {
            "tokensUsed": ai_usage.tokensUsed,
            "promptTokens": ai_usage.promptTokens,
            "completionTokens": ai_usage.completionTokens,
            "totalRequests": ai_usage.totalRequests
        } if ai_usage else None,
        "_count": {
            "users": user_count,
            "projects": project_count,
            "datasets": dataset_count,
            "uploads": upload_count,
            "jobs": job_count
        }
    }

@router.patch("/tenant")
async def update_tenant(
    tenant_data: TenantUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update tenant details"""
    tenant_id = current_user["tenantId"]
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant_data.name is not None:
        tenant.name = tenant_data.name
    if tenant_data.plan is not None:
        tenant.plan = tenant_data.plan
    if tenant_data.status is not None:
        tenant.status = tenant_data.status
    
    db.commit()
    db.refresh(tenant)
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="TENANT_UPDATED",
        entityType="Tenant",
        entityId=tenant_id,
        diffJson=tenant_data.dict(exclude_none=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "plan": tenant.plan,
        "status": tenant.status,
        "createdAt": tenant.createdAt
    }

# ============================================================================
# QUOTAS MANAGEMENT
# ============================================================================

@router.get("/quotas")
async def get_quotas(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get quotas with current usage"""
    tenant_id = current_user["tenantId"]
    
    quotas = db.query(Quotas).filter(Quotas.tenantId == tenant_id).first()
    
    if not quotas:
        quotas = Quotas(tenantId=tenant_id)
        db.add(quotas)
        db.commit()
        db.refresh(quotas)
    
    # Get current usage
    project_count = db.query(Project).filter(Project.tenantId == tenant_id).count()
    
    # Get uploads this month
    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    upload_count = db.query(Upload).filter(
        Upload.tenantId == tenant_id,
        Upload.createdAt >= first_day_of_month
    ).count()
    
    return {
        "id": quotas.id,
        "tenantId": quotas.tenantId,
        "maxProjects": quotas.maxProjects,
        "maxStorageBytes": str(quotas.maxStorageBytes),
        "maxUploadsPerMonth": quotas.maxUploadsPerMonth,
        "maxApiCallsPerMonth": quotas.maxApiCallsPerMonth,
        "maxAiTokensPerMonth": quotas.maxAiTokensPerMonth,
        "currentProjects": project_count,
        "currentUploads": upload_count
    }

@router.put("/quotas")
async def update_quotas(
    quotas_data: QuotasUpdate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update quotas"""
    tenant_id = current_user["tenantId"]
    
    quotas = db.query(Quotas).filter(Quotas.tenantId == tenant_id).first()
    
    if not quotas:
        quotas = Quotas(tenantId=tenant_id)
        db.add(quotas)
    
    if quotas_data.maxProjects is not None:
        quotas.maxProjects = quotas_data.maxProjects
    if quotas_data.maxStorageBytes is not None:
        quotas.maxStorageBytes = quotas_data.maxStorageBytes
    if quotas_data.maxUploadsPerMonth is not None:
        quotas.maxUploadsPerMonth = quotas_data.maxUploadsPerMonth
    if quotas_data.maxApiCallsPerMonth is not None:
        quotas.maxApiCallsPerMonth = quotas_data.maxApiCallsPerMonth
    if quotas_data.maxAiTokensPerMonth is not None:
        quotas.maxAiTokensPerMonth = quotas_data.maxAiTokensPerMonth
    
    db.commit()
    db.refresh(quotas)
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="QUOTAS_UPDATED",
        entityType="Quotas",
        entityId=quotas.id,
        diffJson=quotas_data.dict(exclude_none=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "id": quotas.id,
        "tenantId": quotas.tenantId,
        "maxProjects": quotas.maxProjects,
        "maxStorageBytes": str(quotas.maxStorageBytes),
        "maxUploadsPerMonth": quotas.maxUploadsPerMonth,
        "maxApiCallsPerMonth": quotas.maxApiCallsPerMonth,
        "maxAiTokensPerMonth": quotas.maxAiTokensPerMonth
    }

# ============================================================================
# AUDIT LOGS
# ============================================================================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    entityType: Optional[str] = None,
    userId: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs with pagination and filters"""
    tenant_id = current_user["tenantId"]
    skip = (page - 1) * limit
    
    query = db.query(AuditLog).filter(AuditLog.tenantId == tenant_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    if entityType:
        query = query.filter(AuditLog.entityType == entityType)
    if userId:
        query = query.filter(AuditLog.actorUserId == userId)
    
    total = query.count()
    logs = query.order_by(AuditLog.createdAt.desc()).offset(skip).limit(limit).all()
    
    # Get user info for each log
    result_logs = []
    for log in logs:
        actor = None
        if log.actorUserId:
            actor = db.query(User).filter(User.id == log.actorUserId).first()
        
        result_logs.append({
            "id": log.id,
            "action": log.action,
            "entityType": log.entityType,
            "entityId": log.entityId,
            "ip": log.ip,
            "userAgent": log.userAgent,
            "diffJson": log.diffJson,
            "createdAt": log.createdAt,
            "actorUser": {
                "id": actor.id,
                "email": actor.email,
                "name": actor.name
            } if actor else None
        })
    
    return {
        "logs": result_logs,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

# ============================================================================
# SYSTEM STATISTICS
# ============================================================================

@router.get("/statistics")
async def get_statistics(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive system statistics"""
    tenant_id = current_user["tenantId"]
    
    # User stats
    total_users = db.query(User).filter(User.tenantId == tenant_id).count()
    active_users = db.query(User).filter(
        User.tenantId == tenant_id,
        User.status == "ACTIVE"
    ).count()
    
    # Resource stats
    total_projects = db.query(Project).filter(Project.tenantId == tenant_id).count()
    total_datasets = db.query(Dataset).filter(Dataset.tenantId == tenant_id).count()
    total_uploads = db.query(Upload).filter(Upload.tenantId == tenant_id).count()
    
    # Job stats
    total_jobs = db.query(Job).filter(Job.tenantId == tenant_id).count()
    completed_jobs = db.query(Job).filter(
        Job.tenantId == tenant_id,
        Job.status == "COMPLETED"
    ).count()
    failed_jobs = db.query(Job).filter(
        Job.tenantId == tenant_id,
        Job.status == "FAILED"
    ).count()
    
    # AI usage
    ai_usage = db.query(AiUsage).filter(AiUsage.tenantId == tenant_id).first()
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_logs = db.query(AuditLog).filter(
        AuditLog.tenantId == tenant_id,
        AuditLog.createdAt >= thirty_days_ago
    ).all()
    
    # Group by action
    activity_counts = {}
    for log in recent_logs:
        activity_counts[log.action] = activity_counts.get(log.action, 0) + 1
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users
        },
        "resources": {
            "projects": total_projects,
            "datasets": total_datasets,
            "uploads": total_uploads
        },
        "jobs": {
            "total": total_jobs,
            "completed": completed_jobs,
            "failed": failed_jobs,
            "successRate": round((completed_jobs / total_jobs * 100), 2) if total_jobs > 0 else 0
        },
        "ai": {
            "tokensUsed": ai_usage.tokensUsed if ai_usage else 0,
            "promptTokens": ai_usage.promptTokens if ai_usage else 0,
            "completionTokens": ai_usage.completionTokens if ai_usage else 0,
            "totalRequests": ai_usage.totalRequests if ai_usage else 0
        },
        "recentActivity": [
            {"action": action, "count": count}
            for action, count in activity_counts.items()
        ]
    }

# ============================================================================
# API KEYS MANAGEMENT
# ============================================================================

@router.get("/api-keys")
async def get_api_keys(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all API keys"""
    tenant_id = current_user["tenantId"]
    
    api_keys = db.query(ApiKey).filter(ApiKey.tenantId == tenant_id).order_by(
        ApiKey.createdAt.desc()
    ).all()
    
    return [
        {
            "id": key.id,
            "name": key.name,
            "scopesJson": key.scopesJson,
            "status": key.status,
            "createdAt": key.createdAt
        }
        for key in api_keys
    ]

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Revoke an API key"""
    tenant_id = current_user["tenantId"]
    
    api_key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.tenantId == tenant_id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.status = "REVOKED"
    db.commit()
    
    # Audit log
    audit = AuditLog(
        tenantId=tenant_id,
        actorUserId=current_user["userId"],
        action="API_KEY_REVOKED",
        entityType="ApiKey",
        entityId=key_id
    )
    db.add(audit)
    db.commit()
    
    return {"success": True}
