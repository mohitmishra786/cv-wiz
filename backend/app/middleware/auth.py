"""
Authentication Middleware
Validates JWT tokens for protected endpoints.
"""

from typing import Optional
import jwt
from jwt.exceptions import PyJWTError as JWTError
from fastapi import HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings


# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def verify_auth_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    Verify JWT auth token from Authorization header.
    
    Args:
        credentials: HTTP Bearer credentials
    
    Returns:
        User ID from token
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    settings = get_settings()
    
    try:
        # Decode JWT token
        # Note: NextAuth uses HS256 by default
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=["HS256"],
        )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing subject",
            )
        
        return user_id
        
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """
    Optionally verify auth token. Returns None if no token provided.
    Useful for endpoints that can work with or without auth.
    
    Args:
        credentials: HTTP Bearer credentials
    
    Returns:
        User ID if token is valid, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        return await verify_auth_token(credentials)
    except HTTPException:
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from a JWT token (sync version for use in services).
    
    Args:
        token: JWT token string
    
    Returns:
        User ID if valid, None otherwise
    """
    settings = get_settings()
    
    try:
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=["HS256"],
        )
        return payload.get("sub")
    except JWTError:
        return None
