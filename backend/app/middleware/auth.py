"""
Authentication Middleware
Validates JWT tokens for protected endpoints with database verification.
"""

from typing import Optional
import jwt
from jwt.exceptions import PyJWTError as JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings
from app.utils.logger import logger


# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def verify_auth_token_with_db(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    Verify JWT auth token from Authorization header with database validation.
    
    This enhanced version validates:
    1. JWT signature and expiration
    2. User exists in the database (via ProfileService)
    3. User account is active
    
    Args:
        credentials: HTTP Bearer credentials
    
    Returns:
        User ID from token
    
    Raises:
        HTTPException: If token is invalid, missing, or user not found in database
    """
    if credentials is None:
        logger.warning("Auth failed: Missing credentials")
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
            logger.warning("Auth failed: Token missing subject", {"token_prefix": token[:16]})
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing subject",
            )
        
        # Database validation: verify user exists and is active
        from app.services.profile_service import ProfileService
        profile_service = ProfileService()
        
        try:
            validated_user_id = await profile_service.validate_token(token)
            
            if validated_user_id is None:
                logger.warning("Auth failed: User not found in database or inactive", {
                    "user_id": user_id,
                    "token_prefix": token[:16],
                })
                raise HTTPException(
                    status_code=401,
                    detail="User not found or account inactive",
                )
            
            # Ensure user IDs match
            if validated_user_id != user_id:
                logger.warning("Auth failed: User ID mismatch", {
                    "token_user_id": user_id,
                    "db_user_id": validated_user_id,
                })
                raise HTTPException(
                    status_code=401,
                    detail="Token user ID does not match database",
                )
            
            logger.debug("Auth success with database validation", {
                "user_id": user_id,
            })
            
            return user_id
            
        finally:
            await profile_service.close()
        
    except JWTError as e:
        logger.warning("Auth failed: Invalid JWT", {
            "error": str(e),
            "token_prefix": token[:16],
        })
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Auth failed: Unexpected error", {
            "error": str(e),
            "token_prefix": token[:16],
        })
        raise HTTPException(
            status_code=500,
            detail="Authentication verification failed",
        )


async def verify_auth_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    Verify JWT auth token from Authorization header (signature validation only).
    
    For endpoints that require JWT validation but not database verification.
    Use verify_auth_token_with_db for full validation including database check.
    
    Args:
        credentials: HTTP Bearer credentials
    
    Returns:
        User ID from token
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    if credentials is None:
        logger.warning("Auth failed: Missing credentials")
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
            logger.warning("Auth failed: Token missing subject", {"token_prefix": token[:16]})
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing subject",
            )
        
        logger.debug("Auth success (JWT only)", {"user_id": user_id})
        return user_id
        
    except JWTError as e:
        logger.warning("Auth failed: Invalid JWT", {
            "error": str(e),
            "token_prefix": token[:16],
        })
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
