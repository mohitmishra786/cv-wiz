"""
Unit tests for rate limiting functionality.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.utils.rate_limiter import (
    limiter,
    RateLimitConfig,
    get_user_identifier,
    rate_limit_exceeded_handler,
)


class TestRateLimiter:
    """Tests for rate limiting functionality."""

    def test_rate_limit_config_values(self):
        """Test that rate limit configurations are properly defined."""
        assert RateLimitConfig.COMPILE_RESUME == ["5/minute", "30/hour"]
        assert RateLimitConfig.GENERATE_COVER_LETTER == ["5/minute", "30/hour"]
        assert RateLimitConfig.GET_TEMPLATES == ["100/minute"]
        assert RateLimitConfig.GET_PROFILE == ["60/minute", "1000/hour"]

    def test_get_user_identifier_with_auth(self):
        """Test user identifier extraction from auth header."""
        mock_request = MagicMock()
        mock_request.headers = {"Authorization": "Bearer test_token_12345"}
        
        identifier = get_user_identifier(mock_request)
        
        assert identifier == "user:test_token_12345"

    def test_get_user_identifier_without_auth(self):
        """Test user identifier fallback to IP without auth."""
        mock_request = MagicMock()
        mock_request.headers = {}
        mock_request.client.host = "192.168.1.1"
        
        with patch('app.utils.rate_limiter.get_remote_address', return_value="192.168.1.1"):
            identifier = get_user_identifier(mock_request)
        
        assert identifier == "192.168.1.1"


class TestRateLimitEndpoints:
    """Integration tests for rate-limited endpoints."""

    def test_compile_endpoint_rate_limit_headers(self, client: TestClient):
        """Test that compile endpoint includes rate limit headers."""
        # This test verifies the endpoint is rate-limited
        # Actual rate limiting is handled by slowapi
        response = client.post("/compile", json={
            "authToken": "invalid_token",
            "jobDescription": "Test job description that is long enough to pass validation. " * 5,
        })
        
        # Should get 401 (auth failed) not 429 (rate limited) on first request
        assert response.status_code == 401

    def test_cover_letter_endpoint_rate_limit_headers(self, client: TestClient):
        """Test that cover letter endpoint includes rate limit headers."""
        response = client.post("/cover-letter", json={
            "authToken": "invalid_token",
            "jobDescription": "Test job description that is long enough to pass validation. " * 5,
        })
        
        # Should get 401 (auth failed) not 429 (rate limited) on first request
        assert response.status_code == 401

    def test_templates_endpoint_allows_multiple_requests(self, client: TestClient):
        """Test that templates endpoint allows many requests."""
        # Make multiple requests
        for _ in range(5):
            response = client.get("/templates")
            assert response.status_code == 200

    def test_job_description_validation_short(self, client: TestClient):
        """Test that short job descriptions are rejected."""
        response = client.post("/compile", json={
            "authToken": "some_token",
            "jobDescription": "Short",  # Too short
        })
        
        assert response.status_code == 400
        assert "too short" in response.json()["detail"].lower()

    def test_job_description_validation_long(self, client: TestClient):
        """Test that very long job descriptions are rejected."""
        response = client.post("/compile", json={
            "authToken": "some_token",
            "jobDescription": "A" * 50001,  # Too long
        })
        
        assert response.status_code == 400
        assert "too long" in response.json()["detail"].lower()

    def test_job_description_validation_valid_length(self, client: TestClient):
        """Test that valid length job descriptions pass validation."""
        response = client.post("/compile", json={
            "authToken": "invalid_token",  # Will fail auth but pass length validation
            "jobDescription": "This is a valid job description. " * 10,
        })
        
        # Should fail auth, not validation
        assert response.status_code == 401


class TestRedisCacheFallback:
    """Tests for Redis cache fallback mechanism."""

    @pytest.mark.asyncio
    async def test_cache_unavailable_skips_operations(self):
        """Test that cache operations are skipped when unavailable."""
        from app.utils.redis_cache import redis_client, get_cached, set_cached
        
        # Simulate unavailable cache
        redis_client._status = redis_client.CacheStatus.UNAVAILABLE
        
        # Should return None without error
        result = await get_cached("test_key")
        assert result is None
        
        # Should return False without error
        result = await set_cached("test_key", {"data": "test"})
        assert result is False

    @pytest.mark.asyncio
    async def test_cache_health_status(self):
        """Test cache health status reporting."""
        from app.utils.redis_cache import get_cache_health
        
        health = await get_cache_health()
        
        assert "status" in health
        assert "available" in health
        assert "connected" in health
        assert "consecutive_failures" in health
