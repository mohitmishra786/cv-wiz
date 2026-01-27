"""
Redis Cache Utilities
Provides caching for repeated API requests.
"""

import json
import hashlib
from typing import Optional, Any

import redis.asyncio as redis

from app.config import get_settings


class RedisClient:
    """Async Redis client wrapper with connection pooling."""
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
    
    async def get_client(self) -> redis.Redis:
        """Get or create Redis client connection."""
        if self._client is None:
            settings = get_settings()
            self._client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client
    
    async def ping(self):
        """Ping Redis server."""
        client = await self.get_client()
        return await client.ping()
    
    async def close(self):
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None


# Global Redis client instance
redis_client = RedisClient()


def generate_cache_key(user_id: str, job_description: str, prefix: str = "resume") -> str:
    """
    Generate a cache key based on user ID and job description hash.
    This allows caching repeated requests for the same JD.
    """
    # Hash the job description to create a consistent key
    jd_hash = hashlib.sha256(job_description.encode()).hexdigest()[:16]
    return f"cvwiz:{prefix}:{user_id}:{jd_hash}"


async def get_cached(key: str) -> Optional[dict]:
    """Get cached value from Redis."""
    try:
        client = await redis_client.get_client()
        value = await client.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        # Log error but don't fail - cache is optional
        print(f"Redis get error: {e}")
    return None


async def set_cached(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """
    Set cached value in Redis with optional TTL.
    
    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds (defaults to settings.cache_ttl)
    
    Returns:
        True if cached successfully, False otherwise
    """
    try:
        settings = get_settings()
        client = await redis_client.get_client()
        
        serialized = json.dumps(value, default=str)
        await client.set(
            key,
            serialized,
            ex=ttl or settings.cache_ttl,
        )
        return True
    except Exception as e:
        # Log error but don't fail - cache is optional
        print(f"Redis set error: {e}")
        return False


async def invalidate_cache(pattern: str) -> int:
    """
    Invalidate all cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "cvwiz:resume:user123:*")
    
    Returns:
        Number of keys deleted
    """
    try:
        client = await redis_client.get_client()
        keys = []
        async for key in client.scan_iter(pattern):
            keys.append(key)
        
        if keys:
            return await client.delete(*keys)
        return 0
    except Exception as e:
        print(f"Redis invalidate error: {e}")
        return 0
