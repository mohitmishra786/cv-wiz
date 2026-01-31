"""
Unit tests for Redis cache fallback mechanism.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json

from app.utils.redis_cache import (
    RedisClient,
    CacheStatus,
    get_cached,
    set_cached,
    invalidate_cache,
    get_cache_health,
    generate_cache_key,
)


class TestCacheStatus:
    """Tests for CacheStatus enum."""

    def test_cache_status_values(self):
        """Test that cache status enum has correct values."""
        assert CacheStatus.HEALTHY.value == "healthy"
        assert CacheStatus.DEGRADED.value == "degraded"
        assert CacheStatus.UNAVAILABLE.value == "unavailable"


class TestRedisClient:
    """Tests for RedisClient class."""

    @pytest.fixture
    def redis_client(self):
        """Create a fresh RedisClient instance."""
        client = RedisClient()
        client._client = None
        client._status = CacheStatus.UNAVAILABLE
        client._consecutive_failures = 0
        return client

    def test_initial_state(self, redis_client):
        """Test initial state of RedisClient."""
        assert redis_client._client is None
        assert redis_client._status == CacheStatus.UNAVAILABLE
        assert redis_client._consecutive_failures == 0

    def test_is_available_property(self, redis_client):
        """Test is_available property."""
        assert redis_client.is_available is False
        
        redis_client._status = CacheStatus.HEALTHY
        assert redis_client.is_available is True
        
        redis_client._status = CacheStatus.DEGRADED
        assert redis_client.is_available is True

    def test_record_failure(self, redis_client):
        """Test recording failures updates status."""
        redis_client.record_failure()
        assert redis_client._consecutive_failures == 1
        
        # Record more failures to reach degraded state
        for _ in range(2):
            redis_client.record_failure()
        assert redis_client._status == CacheStatus.DEGRADED
        
        # Record more failures to reach unavailable state
        for _ in range(7):
            redis_client.record_failure()
        assert redis_client._status == CacheStatus.UNAVAILABLE

    def test_record_success_resets_failures(self, redis_client):
        """Test recording success resets failure count."""
        redis_client._consecutive_failures = 5
        redis_client._status = CacheStatus.DEGRADED
        
        redis_client.record_success()
        
        assert redis_client._consecutive_failures == 0
        assert redis_client._status == CacheStatus.HEALTHY

    @pytest.mark.asyncio
    async def test_get_client_returns_none_when_unavailable(self, redis_client):
        """Test that get_client returns None when marked unavailable."""
        redis_client._status = CacheStatus.UNAVAILABLE
        redis_client._consecutive_failures = 10
        
        result = await redis_client.get_client()
        assert result is None


class TestCacheOperations:
    """Tests for cache operations with fallback."""

    @pytest.mark.asyncio
    async def test_get_cached_when_unavailable(self):
        """Test get_cached returns None when cache is unavailable."""
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.is_available = False
            
            result = await get_cached("test_key")
            assert result is None

    @pytest.mark.asyncio
    async def test_set_cached_when_unavailable(self):
        """Test set_cached returns False when cache is unavailable."""
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.is_available = False
            
            result = await set_cached("test_key", {"data": "test"})
            assert result is False

    @pytest.mark.asyncio
    async def test_invalidate_cache_when_unavailable(self):
        """Test invalidate_cache returns 0 when cache is unavailable."""
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.is_available = False
            
            result = await invalidate_cache("pattern:*")
            assert result == 0

    @pytest.mark.asyncio
    async def test_get_cached_success(self):
        """Test successful cache get operation."""
        mock_redis = AsyncMock()
        mock_redis.get.return_value = json.dumps({"data": "cached_value"})
        
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.is_available = True
            mock_client.get_client = AsyncMock(return_value=mock_redis)
            mock_client.record_success = MagicMock()
            
            result = await get_cached("test_key")
            
            assert result == {"data": "cached_value"}
            mock_client.record_success.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_cached_failure(self):
        """Test cache get operation handles errors gracefully."""
        mock_redis = AsyncMock()
        mock_redis.get.side_effect = Exception("Redis error")
        
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.is_available = True
            mock_client.get_client = AsyncMock(return_value=mock_redis)
            mock_client.record_failure = MagicMock()
            
            result = await get_cached("test_key")
            
            assert result is None
            mock_client.record_failure.assert_called_once()


class TestCacheKeyGeneration:
    """Tests for cache key generation."""

    def test_generate_cache_key_consistency(self):
        """Test that cache key generation is consistent."""
        key1 = generate_cache_key("user123", "job description text", "resume")
        key2 = generate_cache_key("user123", "job description text", "resume")
        
        assert key1 == key2
        assert key1.startswith("cvwiz:resume:user123:")

    def test_generate_cache_key_different_inputs(self):
        """Test that different inputs produce different keys."""
        key1 = generate_cache_key("user123", "job description 1", "resume")
        key2 = generate_cache_key("user123", "job description 2", "resume")
        key3 = generate_cache_key("user456", "job description 1", "resume")
        
        assert key1 != key2
        assert key1 != key3
        assert key2 != key3

    def test_generate_cache_key_different_prefixes(self):
        """Test that different prefixes produce different keys."""
        key1 = generate_cache_key("user123", "job description", "resume")
        key2 = generate_cache_key("user123", "job description", "cover_letter")
        
        assert key1 != key2
        assert "resume" in key1
        assert "cover_letter" in key2


class TestCacheHealth:
    """Tests for cache health monitoring."""

    @pytest.mark.asyncio
    async def test_get_cache_health(self):
        """Test cache health status reporting."""
        with patch('app.utils.redis_cache.redis_client') as mock_client:
            mock_client.status = CacheStatus.HEALTHY
            mock_client.is_available = True
            mock_client.ping = AsyncMock(return_value=True)
            mock_client._consecutive_failures = 0
            
            health = await get_cache_health()
            
            assert health["status"] == "healthy"
            assert health["available"] is True
            assert health["connected"] is True
            assert health["consecutive_failures"] == 0
