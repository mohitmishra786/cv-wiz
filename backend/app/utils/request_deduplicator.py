"""
Request Deduplication for LLM Calls
Prevents duplicate API requests by caching in-flight requests
"""

import asyncio
import hashlib
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

from app.utils.logger import logger


@dataclass
class InFlightRequest:
    """Represents a request that is currently in flight."""
    future: asyncio.Future
    timestamp: datetime
    request_hash: str


class RequestDeduplicator:
    """
    Deduplicates LLM API requests to prevent wasting quota.
    
    When multiple identical requests are made simultaneously, only one
    actual API call is made, and all callers receive the same result.
    """
    
    def __init__(self, ttl_seconds: float = 30.0):
        """
        Initialize the deduplicator.
        
        Args:
            ttl_seconds: Time-to-live for in-flight requests (default: 30 seconds)
        """
        self._in_flight: Dict[str, InFlightRequest] = {}
        self._ttl = timedelta(seconds=ttl_seconds)
        self._lock = asyncio.Lock()
    
    def _generate_request_hash(self, *args, **kwargs) -> str:
        """Generate a hash for the request based on arguments."""
        # Create a deterministic string representation
        content = f"args:{str(args)}|kwargs:{str(sorted(kwargs.items()))}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    async def execute(self, key_prefix: str, func, *args, **kwargs) -> Any:
        """
        Execute a function with deduplication.
        
        If an identical request is already in flight, wait for its result
        instead of making a duplicate call.
        
        Args:
            key_prefix: Prefix for the request key (e.g., "cover_letter", "interview_prep")
            func: The async function to execute
            *args, **kwargs: Arguments to pass to the function
            
        Returns:
            The result of the function call
        """
        request_hash = self._generate_request_hash(*args, **kwargs)
        cache_key = f"{key_prefix}:{request_hash}"
        
        async with self._lock:
            # Check if there's an in-flight request
            if cache_key in self._in_flight:
                in_flight = self._in_flight[cache_key]
                
                # Check if it's not expired
                if datetime.utcnow() - in_flight.timestamp < self._ttl:
                    logger.info("[Deduplicator] Returning cached in-flight request", {
                        "cache_key": cache_key,
                        "age_seconds": (datetime.utcnow() - in_flight.timestamp).total_seconds(),
                    })
                    # Return the existing future's result
                    try:
                        return await asyncio.wait_for(
                            asyncio.shield(in_flight.future),
                            timeout=self._ttl.total_seconds()
                        )
                    except asyncio.TimeoutError:
                        logger.warning("[Deduplicator] In-flight request timed out, making new request")
                        # Remove expired request and continue
                        del self._in_flight[cache_key]
                else:
                    # Expired, remove it
                    logger.debug("[Deduplicator] Expired in-flight request removed", {
                        "cache_key": cache_key,
                    })
                    del self._in_flight[cache_key]
            
            # Create a new future for this request
            future = asyncio.get_event_loop().create_future()
            self._in_flight[cache_key] = InFlightRequest(
                future=future,
                timestamp=datetime.utcnow(),
                request_hash=request_hash,
            )
        
        # Execute the function (outside the lock to allow concurrent deduplication checks)
        try:
            logger.info("[Deduplicator] Executing deduplicated request", {
                "cache_key": cache_key,
                "function": func.__name__,
            })
            
            result = await func(*args, **kwargs)
            
            # Set the result on the future
            if not future.done():
                future.set_result(result)
            
            return result
            
        except Exception as e:
            # Set the exception on the future
            if not future.done():
                future.set_exception(e)
            raise
            
        finally:
            # Clean up the in-flight request
            async with self._lock:
                if cache_key in self._in_flight:
                    del self._in_flight[cache_key]
    
    async def cleanup_expired(self) -> int:
        """
        Clean up expired in-flight requests.
        
        Returns:
            Number of expired requests removed
        """
        now = datetime.utcnow()
        expired_keys = []
        
        async with self._lock:
            for key, in_flight in self._in_flight.items():
                if now - in_flight.timestamp > self._ttl:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._in_flight[key]
        
        if expired_keys:
            logger.info("[Deduplicator] Cleaned up expired requests", {
                "count": len(expired_keys),
            })
        
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current deduplicator statistics."""
        now = datetime.utcnow()
        return {
            "in_flight_count": len(self._in_flight),
            "ttl_seconds": self._ttl.total_seconds(),
            "requests": [
                {
                    "key": key,
                    "age_seconds": (now - req.timestamp).total_seconds(),
                    "hash": req.request_hash,
                }
                for key, req in self._in_flight.items()
            ],
        }


# Global deduplicator instance
_deduplicator: Optional[RequestDeduplicator] = None


def get_deduplicator() -> RequestDeduplicator:
    """Get the global deduplicator instance."""
    global _deduplicator
    if _deduplicator is None:
        _deduplicator = RequestDeduplicator()
    return _deduplicator
