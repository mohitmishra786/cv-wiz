"""
Test query parameter sanitization to prevent sensitive data logging.
"""

from starlette.datastructures import QueryParams

from app.utils.logger import sanitize_query_params, sanitize_dict


class TestSanitizeQueryParams:
    """Tests for sanitize_query_params function."""
    
    def test_sanitize_password(self):
        """Test that password parameter is masked."""
        query = QueryParams({"password": "secret123", "user": "test"})
        result = sanitize_query_params(query)
        
        assert result is not None
        assert result["password"] == "***"
        assert result["user"] == "test"
    
    def test_sanitize_token(self):
        """Test that token parameter is masked."""
        query = QueryParams({"token": "abc123def456", "id": "123"})
        result = sanitize_query_params(query)
        
        assert result["token"] == "***"
        assert result["id"] == "123"
    
    def test_sanitize_api_key(self):
        """Test that api_key parameter is masked."""
        query = QueryParams({"api_key": "secret_api_key", "page": "1"})
        result = sanitize_query_params(query)
        
        assert result["api_key"] == "***"
        assert result["page"] == "1"
    
    def test_sanitize_multiple_sensitive_keys(self):
        """Test that multiple sensitive parameters are masked."""
        query = QueryParams({
            "password": "pass123",
            "access_token": "token123",
            "api_key": "key123",
            "user": "testuser",
        })
        result = sanitize_query_params(query)
        
        assert result["password"] == "***"
        assert result["access_token"] == "***"
        assert result["api_key"] == "***"
        assert result["user"] == "testuser"
    
    def test_sanitize_case_insensitive(self):
        """Test that key matching is case-insensitive."""
        query = QueryParams({
            "Password": "pass123",
            "TOKEN": "token123",
            "Api-Key": "key123",
        })
        result = sanitize_query_params(query)
        
        assert result["Password"] == "***"
        assert result["TOKEN"] == "***"
        assert result["Api-Key"] == "***"
    
    def test_sanitize_long_values(self):
        """Test that long non-sensitive values are truncated."""
        query = QueryParams({"description": "a" * 150, "password": "secret"})
        result = sanitize_query_params(query)
        
        assert result["description"] == "a" * 100 + "..."
        assert result["password"] == "***"
    
    def test_sanitize_empty_query(self):
        """Test that empty query params return None."""
        query = QueryParams({})
        result = sanitize_query_params(query)
        
        assert result is None
    
    def test_sanitize_none_query(self):
        """Test that None query params return None."""
        result = sanitize_query_params(None)
        
        assert result is None


class TestSanitizeDict:
    """Tests for sanitize_dict function."""
    
    def test_sanitize_dict_simple(self):
        """Test sanitization of simple dictionary."""
        data = {
            "username": "testuser",
            "password": "secret123",
            "email": "test@example.com",
        }
        result = sanitize_dict(data)
        
        assert result["username"] == "testuser"
        assert result["password"] == "***"
        assert result["email"] == "test@example.com"
    
    def test_sanitize_dict_nested(self):
        """Test sanitization of nested dictionary."""
        data = {
            "user": "testuser",
            "credentials": {
                "password": "secret123",
                "api_key": "key123",
            },
            "settings": {
                "theme": "dark",
            },
        }
        result = sanitize_dict(data)
        
        assert result["user"] == "testuser"
        assert result["credentials"]["password"] == "***"
        assert result["credentials"]["api_key"] == "***"
        assert result["settings"]["theme"] == "dark"
    
    def test_sanitize_dict_with_list(self):
        """Test sanitization of dictionary containing lists."""
        data = {
            "users": [
                {"name": "user1", "password": "pass1"},
                {"name": "user2", "password": "pass2"},
            ],
            "count": 2,
        }
        result = sanitize_dict(data)
        
        assert result["users"][0]["name"] == "user1"
        assert result["users"][0]["password"] == "***"
        assert result["users"][1]["password"] == "***"
        assert result["count"] == 2
    
    def test_sanitize_dict_custom_sensitive_keys(self):
        """Test sanitization with custom sensitive keys."""
        data = {
            "username": "test",
            "secret_value": "hidden",
            "public_value": "visible",
        }
        custom_keys = {"secret_value"}
        result = sanitize_dict(data, sensitive_keys=custom_keys)
        
        assert result["username"] == "test"
        assert result["secret_value"] == "***"
        assert result["public_value"] == "visible"
    
    def test_sanitize_dict_preserves_structure(self):
        """Test that sanitization preserves original structure."""
        data = {
            "level1": {
                "level2": {
                    "password": "secret",
                    "value": 123,
                },
            },
            "list": [
                {"token": "abc"},
                {"safe": "value"},
            ],
        }
        result = sanitize_dict(data)
        
        assert "level1" in result
        assert "level2" in result["level1"]
        assert result["level1"]["level2"]["password"] == "***"
        assert result["level1"]["level2"]["value"] == 123
        assert result["list"][0]["token"] == "***"
        assert result["list"][1]["safe"] == "value"
