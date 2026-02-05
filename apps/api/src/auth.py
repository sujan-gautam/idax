from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get current authenticated user from token
    In production, this should decode JWT token and verify signature
    """
    # Simple dev bypass - get first user
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return user data as dict for easier access
    return {
        "userId": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "tenantId": user.tenantId,
        "status": user.status
    }

def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency that requires admin or owner role
    """
    if current_user["role"] not in ["ADMIN", "OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
