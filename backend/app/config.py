"""
Configuration module for CV-Wiz backend.
Loads environment variables and provides typed settings.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - supports multiple env var names
    database_url: str = Field(
        default="postgresql://localhost:5432/cv_wiz",
        validation_alias="DATABASE_URL"
    )
    
    # Redis - supports multiple env var names for Upstash
    redis_url: str = Field(
        default="redis://localhost:6379",
        validation_alias="REDIS_URL"
    )
    
    # Upstash Redis REST API (alternative to redis URL)
    upstash_redis_rest_url: str = Field(default="", validation_alias="UPSTASH_REDIS_RES_KV_REST_API_URL")
    upstash_redis_rest_token: str = Field(default="", validation_alias="UPSTASH_REDIS_RES_KV_REST_API_TOKEN")
    
    # Groq LLM
    groq_api_key: str = Field(default="", validation_alias="GROQ_API_KEY")
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Auth
    nextauth_secret: str = Field(default="", validation_alias="NEXTAUTH_SECRET")
    auth_secret: str = Field(default="", validation_alias="AUTH_SECRET")  # NextAuth v5 uses AUTH_SECRET
    nextauth_url: str = Field(default="http://localhost:3000", validation_alias="NEXTAUTH_URL")
    
    # Frontend API (for fetching user profiles)
    frontend_api_url: str = Field(default="http://localhost:3000", validation_alias="FRONTEND_API_URL")
    
    # Cache TTL (seconds)
    cache_ttl: int = 300  # 5 minutes
    cache_ttl_short: int = 60  # 1 minute for frequently changing data
    cache_ttl_long: int = 3600  # 1 hour for static data
    
    # PDF settings
    max_resume_pages: int = 1
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields from .env
        populate_by_name = True  # Allow using either field name or alias
    
    @property
    def effective_secret(self) -> str:
        """Get the effective auth secret (AUTH_SECRET or NEXTAUTH_SECRET)."""
        return self.auth_secret or self.nextauth_secret
    
    @property
    def effective_redis_url(self) -> str:
        """Get Redis URL, preferring direct URL over REST API."""
        return self.redis_url if self.redis_url != "redis://localhost:6379" else ""


def _get_env_with_fallbacks(primary: str, *fallbacks: str, default: str = "") -> str:
    """Get environment variable with fallback options."""
    value = os.getenv(primary)
    if value:
        return value
    for fallback in fallbacks:
        value = os.getenv(fallback)
        if value:
            return value
    return default


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with environment variable fallbacks."""
    # Handle custom env var names before creating settings
    env_mappings = {
        "DATABASE_URL": ["CV_DATABASE_DATABASE_URL", "DATABASE_POSTGRES_URL", "DATABASE_URL"],
        "REDIS_URL": ["UPSTASH_REDIS_RES_REDIS_URL", "UPSTASH_REDIS_RES_KV_URL", "REDIS_URL"],
    }
    
    for target, sources in env_mappings.items():
        if not os.getenv(target):
            for source in sources:
                value = os.getenv(source)
                if value:
                    os.environ[target] = value
                    break
    
    return Settings()
