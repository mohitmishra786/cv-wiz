"""
Tests for Filename Validation
"""
import pytest
from fastapi import HTTPException
from app.routers.upload import validate_filename


class TestFilenameValidation:
    """Tests for filename validation security."""
    
    def test_valid_filename(self):
        """Test that valid filenames are accepted."""
        # Should not raise
        validate_filename("resume.pdf", "test-123")
        validate_filename("My Resume 2024.docx", "test-123")
        validate_filename("cv(1).txt", "test-123")
        validate_filename("file_name.md", "test-123")
    
    def test_path_traversal_rejected(self):
        """Test that path traversal attempts are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("../etc/passwd.pdf", "test-123")
        assert "path traversal" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("..\\windows\\system32.pdf", "test-123")
        assert "path traversal" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("folder/file.pdf", "test-123")
        assert "path traversal" in exc_info.value.detail.lower()
    
    def test_null_byte_rejected(self):
        """Test that null bytes are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file\x00.pdf", "test-123")
        assert "null byte" in exc_info.value.detail.lower()
    
    def test_empty_filename_rejected(self):
        """Test that empty filenames are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("", "test-123")
        assert "required" in exc_info.value.detail.lower()
    
    def test_long_filename_rejected(self):
        """Test that very long filenames are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("a" * 256 + ".pdf", "test-123")
        assert "too long" in exc_info.value.detail.lower()
    
    def test_control_characters_rejected(self):
        """Test that control characters are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file\x01.pdf", "test-123")
        assert "control characters" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file\x1f.pdf", "test-123")
        assert "control characters" in exc_info.value.detail.lower()
    
    def test_unsafe_characters_rejected(self):
        """Test that unsafe characters are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file<name>.pdf", "test-123")
        assert "unsafe characters" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file:name.pdf", "test-123")
        assert "unsafe characters" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file|name.pdf", "test-123")
        assert "unsafe characters" in exc_info.value.detail.lower()
        
        with pytest.raises(HTTPException) as exc_info:
            validate_filename("file'name.pdf", "test-123")
        assert "unsafe characters" in exc_info.value.detail.lower()
