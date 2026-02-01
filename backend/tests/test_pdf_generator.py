"""
Tests for PDF Generator
"""
import sys
from unittest.mock import MagicMock, patch
import pytest

# Mock weasyprint modules BEFORE importing the module under test
mock_wp = MagicMock()
mock_wp.HTML = MagicMock()
mock_wp.CSS = MagicMock()
sys.modules["weasyprint"] = mock_wp

mock_wp_fonts = MagicMock()
mock_wp_fonts.FontConfiguration = MagicMock()
sys.modules["weasyprint.text.fonts"] = mock_wp_fonts

from app.utils.pdf_generator import PDFGenerator  # noqa: E402
from app.models.resume import CompiledResume  # noqa: E402


@pytest.fixture
def generator():
    """Create PDFGenerator with mocked weasyprint."""
    return PDFGenerator()


def test_generate_html(generator):
    """Test HTML generation from resume data."""
    resume = CompiledResume(
        name="Test User",
        email="test@example.com",
        template="experience-skills-projects",
        experiences=[],
        projects=[],
        educations=[],
        skills=[],
        publications=[]
    )
    html = generator.generate_html(resume)
    assert "Test User" in html
    assert "test@example.com" in html


def test_generate_pdf(generator):
    """Test PDF generation returns bytes."""
    # Setup mock return values
    mock_document = MagicMock()
    mock_document.pages = [MagicMock()]  # 1 page
    mock_wp.HTML.return_value.render.return_value = mock_document
    
    resume = CompiledResume(
        name="Test User",
        email="test@example.com",
        template="experience-skills-projects",
        experiences=[],
        projects=[],
        educations=[],
        skills=[],
        publications=[]
    )
    
    # Patch BytesIO to capture what gets written
    mock_buffer = MagicMock()
    mock_buffer.getvalue.return_value = b"PDF CONTENT"
    
    with patch('app.utils.pdf_generator.BytesIO', return_value=mock_buffer):
        pdf_bytes = generator.generate_pdf(resume)
    
    assert pdf_bytes == b"PDF CONTENT"


def test_generate_pdf_page_limit_exceeded(generator):
    """Test that exceeding page limit raises ValueError."""
    # Mock 2 pages
    mock_document = MagicMock()
    mock_document.pages = [MagicMock(), MagicMock()]
    mock_wp.HTML.return_value.render.return_value = mock_document
    
    resume = CompiledResume(
        name="Test User",
        email="test@example.com",
        template="experience-skills-projects",
        experiences=[],
        projects=[],
        educations=[],
        skills=[],
        publications=[]
    )
    
    with pytest.raises(ValueError, match="exceeds 1 page"):
        generator.generate_pdf(resume, max_pages=1)


def test_generate_pdf_base64(generator):
    """Test PDF generation returns base64 string."""
    # Mock return for this test specifically
    mock_document = MagicMock()
    mock_document.pages = [MagicMock()]
    mock_wp.HTML.return_value.render.return_value = mock_document
    
    resume = CompiledResume(
        name="Test User",
        email="test@example.com",
        template="experience-skills-projects",
        experiences=[],
        projects=[],
        educations=[],
        skills=[],
        publications=[]
    )
    
    # Patch BytesIO to return predictable content
    mock_buffer = MagicMock()
    mock_buffer.getvalue.return_value = b"PDF CONTENT"
    
    with patch('app.utils.pdf_generator.BytesIO', return_value=mock_buffer):
        b64 = generator.generate_pdf_base64(resume)
    
    # "PDF CONTENT" -> "UERGIENPTlRFTlQ="
    assert b64 == "UERGIENPTlRFTlQ="


def test_preview_html(generator):
    """Test HTML preview generation."""
    resume = CompiledResume(
        name="Test User",
        email="test@example.com",
        template="experience-skills-projects",
        experiences=[],
        projects=[],
        educations=[],
        skills=[],
        publications=[]
    )
    
    preview = generator.preview_html(resume)
    assert "Test User" in preview
    assert "test@example.com" in preview
    assert "<style>" in preview


def test_pdf_generator_uses_process_pool():
    """Test that PDF generation uses ProcessPoolExecutor for CPU-bound work."""
    from concurrent.futures import ProcessPoolExecutor
    from app.services.resume_compiler import _pdf_executor
    
    # Verify that the executor is a ProcessPoolExecutor
    assert isinstance(_pdf_executor, ProcessPoolExecutor), \
        "PDF generation should use ProcessPoolExecutor for CPU-bound work"
    
    # Verify it has reasonable worker count
    assert _pdf_executor._max_workers >= 2, \
        "ProcessPoolExecutor should have at least 2 workers for parallel PDF generation"
