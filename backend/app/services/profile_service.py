"""
Profile Service
Fetches user profile data from the Next.js frontend API.
Uses shared HTTP client for better resource management.
"""

import time
from typing import Optional
import asyncio
import httpx

from app.config import get_settings
from app.models.user import UserProfile
from app.utils.logger import logger, get_request_id, log_auth_operation


# Module-level shared HTTP client (lazy initialization)
_http_client = None
_http_client_lock = asyncio.Lock()


async def get_shared_http_client() -> httpx.AsyncClient:
    """Get or create the shared HTTP client instance."""
    global _http_client
    async with _http_client_lock:
        if _http_client is None:
            _http_client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            )
            logger.info("[ProfileService] Shared HTTP client created")
    return _http_client


async def close_shared_http_client():
    """Close the shared HTTP client. Should be called on shutdown."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
        logger.info("[ProfileService] Shared HTTP client closed")


class ProfileService:
    """
    Service for fetching and managing user profile data.
    Communicates with the Next.js frontend API.
    Uses shared HTTP client for better resource management.
    """
    
    def __init__(self):
        """Initialize profile service with shared HTTP client."""
        settings = get_settings()
        self.base_url = settings.frontend_api_url
        logger.info("ProfileService initialized", {"base_url": self.base_url})
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def get_profile(self, auth_token: str) -> Optional[UserProfile]:
        """
        Fetch user profile from frontend API.
        """
        request_id = get_request_id()
        start_time = time.time()
        
        logger.start_operation("ProfileService.get_profile", {
            "request_id": request_id,
            "has_token": bool(auth_token),
            "token_length": len(auth_token) if auth_token else 0,
        })
        
        try:
            logger.debug("Calling frontend API for profile", {
                "request_id": request_id,
                "url": f"{self.base_url}/api/profile",
            })
            
            client = await get_shared_http_client()
            response = await client.get(
                f"{self.base_url}/api/profile",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                },
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            logger.info("Frontend API response received", {
                "request_id": request_id,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
            })
            
            if response.status_code == 401:
                logger.warning("Profile fetch failed - unauthorized", {
                    "request_id": request_id,
                    "status_code": 401,
                })
                log_auth_operation("profile:fetch", success=False, data={"reason": "unauthorized"})
                return None
            
            if response.status_code == 404:
                logger.warning("Profile not found", {
                    "request_id": request_id,
                    "status_code": 404,
                })
                log_auth_operation("profile:fetch", success=False, data={"reason": "not_found"})
                return None
            
            response.raise_for_status()
            
            data = response.json()
            profile = UserProfile(**data)
            
            logger.end_operation("ProfileService.get_profile", duration_ms, {
                "request_id": request_id,
                "user_id": profile.id,
                "user_email": profile.email[:3] + "***" if profile.email else None,
                "experiences_count": len(profile.experiences) if profile.experiences else 0,
                "projects_count": len(profile.projects) if profile.projects else 0,
                "skills_count": len(profile.skills) if profile.skills else 0,
            })
            
            log_auth_operation("profile:fetch", user_id=profile.id, success=True)
            
            return profile
            
        except httpx.HTTPStatusError as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error("Profile API HTTP error", {
                "request_id": request_id,
                "status_code": e.response.status_code,
                "error": str(e),
                "duration_ms": duration_ms,
            }, exc_info=True)
            raise
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.fail_operation("ProfileService.get_profile", e, {
                "request_id": request_id,
                "duration_ms": duration_ms,
            })
            return None
    
    async def validate_token(self, auth_token: str) -> Optional[str]:
        """
        Validate auth token and return user ID if valid.
        """
        request_id = get_request_id()
        start_time = time.time()
        
        logger.start_operation("ProfileService.validate_token", {
            "request_id": request_id,
            "has_token": bool(auth_token),
        })
        
        try:
            logger.debug("Validating auth token", {"request_id": request_id})
            
            client = await get_shared_http_client()
            response = await client.get(
                f"{self.base_url}/api/auth/session",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                },
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                logger.warning("Token validation failed", {
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                })
                log_auth_operation("token:validate", success=False)
                return None
            
            session = response.json()
            user_id = session.get("user", {}).get("id")
            
            logger.end_operation("ProfileService.validate_token", duration_ms, {
                "request_id": request_id,
                "user_id": user_id,
                "success": bool(user_id),
            })
            
            log_auth_operation("token:validate", user_id=user_id, success=True)
            
            return user_id
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.fail_operation("ProfileService.validate_token", e, {
                "request_id": request_id,
                "duration_ms": duration_ms,
            })
            return None
    
    async def close(self):
        """Close ProfileService (note: shared client is not closed here)."""
        logger.debug("ProfileService.close called (shared client not closed)")
        # The shared HTTP client is managed at module level and should be closed
        # explicitly via close_shared_http_client() during application shutdown
