from unittest.mock import patch, MagicMock
import pytest

def test_enhance_bullet_validation(client):
    """Test validation error for enhance-bullet."""
    response = client.post("/ai/enhance-bullet", json={})
    assert response.status_code == 422 # FastAPI validation error

@patch("app.services.groq_client.GroqClient.enhance_bullet")
def test_enhance_bullet_success(mock_enhance, client):
    """Test successful bullet enhancement."""
    mock_enhance.return_value = "Enhanced bullet point"
    
    response = client.post("/ai/enhance-bullet", json={"bullet": "Worked on stuff"})
    assert response.status_code == 200
    assert response.json()["enhanced_bullet"] == "Enhanced bullet point"

@patch("app.services.groq_client.GroqClient.generate_interview_prep")
def test_interview_prep_success(mock_prep, client):
    """Test successful interview prep generation."""
    mock_prep.return_value = [
        {
            "question": "Tell me about yourself",
            "suggested_answer": "I am a dev",
            "key_points": ["Point 1", "Point 2"]
        }
    ]
    
    response = client.post("/ai/interview-prep", json={"candidate_info": "Some info"})
    assert response.status_code == 200
    assert len(response.json()["questions"]) == 1
    assert response.json()["questions"][0]["question"] == "Tell me about yourself"
