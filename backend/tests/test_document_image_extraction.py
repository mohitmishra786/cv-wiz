"""
Tests for embedded image extraction from PDFs (resume / cover letter uploads).
"""

from __future__ import annotations

import pytest

from app.services.resume_parser import ResumeParser


def _tiny_jpeg_pdf_bytes() -> bytes:
    """Build a one-page PDF containing an embedded image via PyMuPDF."""
    fitz = pytest.importorskip("fitz")
    doc = fitz.open()
    page = doc.new_page(width=200, height=200)
    # Solid RGB pixmap large enough to pass MIN_IMAGE_DIM (48)
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 80, 80), 1)
    pix.clear_with(0x80)
    page.insert_image(fitz.Rect(20, 20, 100, 100), pixmap=pix)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_extract_images_from_pdf_finds_embedded_image() -> None:
    parser = ResumeParser()
    pdf_bytes = _tiny_jpeg_pdf_bytes()
    images = parser._extract_images_from_pdf(pdf_bytes)
    assert len(images) >= 1
    img = images[0]
    assert img["data_url"].startswith("data:image/")
    assert img["width"] >= 48 or img["height"] >= 48 or img["byte_size"] > 0
    profile = parser._pick_profile_image(images)
    assert profile is not None
    assert profile.get("is_profile") is True


def test_image_record_skips_tiny_icons() -> None:
    parser = ResumeParser()
    rec = parser._image_record(b"\xff\xd8\xff" + b"\x00" * 100, "jpeg", 16, 16)
    assert rec is None
