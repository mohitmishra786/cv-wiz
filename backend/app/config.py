"""
Configuration module for CV-Wiz backend.
Loads environment variables and provides typed settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://localhost:5432/cv_wiz"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Groq LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Auth
    nextauth_secret: str = ""
    nextauth_url: str = "http://localhost:3000"
    
    # Frontend API (for fetching user profiles)
    frontend_api_url: str = "http://localhost:3000"
    
    # Cache TTL (seconds)
    cache_ttl: int = 300  # 5 minutes
    
    # PDF settings
    max_resume_pages: int = 1
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields from .env


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
