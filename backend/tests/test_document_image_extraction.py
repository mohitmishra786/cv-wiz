"""
Tests for embedded image extraction from PDFs (resume / cover letter uploads).
"""

from __future__ import annotations

import base64
import io

import pytest

from app.services.resume_parser import ResumeParser


def _tiny_jpeg_pdf_bytes() -> bytes:
    """Build a one-page PDF containing a tiny embedded JPEG via PyMuPDF."""
    fitz = pytest.importorskip("fitz")
    # Minimal valid JPEG (1x1 red pixel)
    jpeg = base64.b64decode(
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
        "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
        "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
        "CAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z"
    )
    # Simpler: create pixmap and insert as image
    doc = fitz.open()
    page = doc.new_page(width=200, height=200)
    # Create a solid RGB image via Pixmap
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 80, 80), 1)
    pix.clear_with(0x80)  # mid gray
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
    # pick profile
    profile = parser._pick_profile_image(images)
    assert profile is not None
    assert profile.get("is_profile") is True


def test_image_record_skips_tiny_icons() -> None:
    parser = ResumeParser()
    rec = parser._image_record(b"\xff\xd8\xff" + b"\x00" * 100, "jpeg", 16, 16)
    assert rec is None
