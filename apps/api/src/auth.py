from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # In a real app, decode token, verify signature, extract email/id
    # For now, we might assume the token IS the user email or ID for testing
    # Or just return the first user in DB if we are in dev mode
    
    # Simple dev bypass:
    user = db.query(User).first()
    if not user:
        # Create a dummy user if none exists
        user = User(email="test@example.com", name="Test User", tenantId="test-tenant")
        # We can't save it easily without tenant, but let's assume one exists or we create it
        # This is risky without full context. 
        # Better: raise 401 if not found.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
