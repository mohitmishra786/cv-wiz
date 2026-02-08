"""
Tests for AI Router Endpoints
Updated to require authentication for all endpoints
"""
import pytest
import jwt
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings


@pytest.fixture
def valid_token():
    """Generate a valid JWT token for testing."""
    settings = get_settings()
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, settings.nextauth_secret, algorithm="HS256")


@pytest.fixture
def mock_groq_client():
    """Mock the GroqClient for testing."""
    mock = AsyncMock()
    mock.enhance_bullet.return_value = "Enhanced bullet point with better impact"
    mock.generate_interview_prep.return_value = [
        {
            "question": "Tell me about yourself",
            "suggested_answer": "I am a software engineer...",
            "key_points": ["Experience", "Skills"]
        }
    ]
    mock.suggest_skills.return_value = ["Python", "JavaScript", "React"]
    return mock


@pytest.fixture
def client(mock_groq_client):
    """Create test client with mocked GroqClient."""
    with patch("app.routers.ai.GroqClient", return_value=mock_groq_client):
        with TestClient(app) as c:
            yield c


def test_enhance_bullet_validation(client):
    """Test validation error for enhance-bullet - requires auth first."""
    response = client.post("/ai/enhance-bullet", json={})
    assert response.status_code == 401  # Auth required before validation


def test_enhance_bullet_success(client, valid_token, mock_groq_client):
    """Test successful bullet enhancement with authentication."""
    response = client.post(
        "/ai/enhance-bullet",
        json={"bullet": "Worked on stuff"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert response.status_code == 200
    assert response.json()["enhanced_bullet"] == "Enhanced bullet point with better impact"
    mock_groq_client.enhance_bullet.assert_called_once()


def test_interview_prep_success(client, valid_token, mock_groq_client):
    """Test successful interview prep generation with authentication."""
    response = client.post(
        "/ai/interview-prep",
        json={"candidate_info": "Some info"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()["questions"]) == 1
    assert response.json()["questions"][0]["question"] == "Tell me about yourself"
    mock_groq_client.generate_interview_prep.assert_called_once()


def test_suggest_skills_success(client, valid_token, mock_groq_client):
    """Test successful skill suggestion with authentication."""
    response = client.post(
        "/ai/suggest-skills",
        json={"experience_text": "I coded in Python"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert response.status_code == 200
    assert "Python" in response.json()["skills"]
    mock_groq_client.suggest_skills.assert_called_once()


def test_suggest_skills_too_short(client, valid_token):
    """Test validation for short text with authentication."""
    response = client.post(
        "/ai/suggest-skills",
        json={"experience_text": "Short"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert response.status_code == 400
    assert "too short" in response.json()["detail"].lower()
