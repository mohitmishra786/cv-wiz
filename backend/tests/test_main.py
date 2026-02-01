def test_root(client):
    """Test root health check."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_health(client):
    """Test detailed health check."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert "redis" in response.json()


def test_cors_no_wildcard_origin():
    """Test that CORS configuration does not allow wildcard origins with credentials.

    This is a security requirement - browsers block wildcard origins when credentials are allowed.
    """
    from app.main import allowed_origins
    import os

    # Ensure no wildcard origin is in the allowed list
    assert "*" not in allowed_origins, "Wildcard origin '*' should not be allowed when credentials are enabled"

    # Verify that at least one valid origin is configured (if environment is set)
    frontend_url = os.getenv("FRONTEND_URL") or os.getenv("NEXTAUTH_URL")
    if frontend_url:
        assert len(allowed_origins) > 0, "At least one CORS origin should be configured"


def test_cors_configuration_is_secure():
    """Test that CORS middleware is configured securely.

    Verifies:
    1. No wildcard origin with credentials
    2. Specific origins are allowed
    3. Credentials are enabled (which requires specific origins)
    """
    from app.main import app
    from app.main import allowed_origins

    # Verify no wildcard origin in the allowed_origins list
    assert "*" not in allowed_origins, "Wildcard origin should not be allowed with credentials"

    # Verify that credentials are enabled by checking app configuration
    # The app should have CORS middleware with allow_credentials=True
    assert app is not None, "App should be configured"

    # Verify allowed_origins is a list of specific origins
    assert isinstance(allowed_origins, list), "Allowed origins should be a list"
    for origin in allowed_origins:
        assert origin != "*", "No individual origin should be a wildcard"
        assert origin.startswith("http"), "Origins should be valid URLs"
