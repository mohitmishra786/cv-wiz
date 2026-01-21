"""
Profile Service
Fetches user profile data from the Next.js frontend API.
"""

from typing import Optional
import httpx

from app.config import get_settings
from app.models.user import UserProfile


class ProfileService:
    """
    Service for fetching and managing user profile data.
    Communicates with the Next.js frontend API.
    """
    
    def __init__(self):
        """Initialize profile service with HTTP client."""
        settings = get_settings()
        self.base_url = settings.frontend_api_url
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
        )
    
    async def get_profile(self, auth_token: str) -> Optional[UserProfile]:
        """
        Fetch user profile from frontend API.
        
        Args:
            auth_token: JWT auth token from NextAuth
        
        Returns:
            UserProfile if found and authorized, None otherwise
        
        Raises:
            httpx.HTTPStatusError: On API errors
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/api/profile",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                },
            )
            
            if response.status_code == 401:
                return None  # Unauthorized
            
            if response.status_code == 404:
                return None  # Profile not found
            
            response.raise_for_status()
            
            data = response.json()
            return UserProfile(**data)
            
        except httpx.HTTPStatusError as e:
            print(f"Profile API error: {e}")
            raise
        except Exception as e:
            print(f"Profile fetch error: {e}")
            return None
    
    async def validate_token(self, auth_token: str) -> Optional[str]:
        """
        Validate auth token and return user ID if valid.
        
        Args:
            auth_token: JWT auth token
        
        Returns:
            User ID if valid, None otherwise
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/api/auth/session",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                },
            )
            
            if response.status_code != 200:
                return None
            
            session = response.json()
            return session.get("user", {}).get("id")
            
        except Exception as e:
            print(f"Token validation error: {e}")
            return None
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
