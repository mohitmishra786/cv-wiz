
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime
from app.services.groq_client import GroqClient
from app.models.user import Experience, Project, Skill, Education

@pytest.fixture
def mock_settings():
    with patch("app.services.groq_client.get_settings") as mock:
        mock.return_value.groq_api_key = "test_key"
        mock.return_value.groq_model = "llama-3-8b-8192"
        yield mock

@pytest.fixture
def mock_groq(mock_settings):
    with patch("app.services.groq_client.Groq") as mock:
        yield mock

@pytest.fixture
def client(mock_groq):
    return GroqClient()

@pytest.mark.asyncio
async def test_generate_cover_letter(client, mock_groq):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Generated Cover Letter"))]
    mock_response.usage.prompt_tokens = 10
    mock_response.usage.completion_tokens = 20
    
    client.client.chat.completions.create.return_value = mock_response
    
    result, model = await client.generate_cover_letter("Candidate Info", "Job Description")
    
    assert result == "Generated Cover Letter"
    assert model == "llama-3-8b-8192"
    client.client.chat.completions.create.assert_called_once()
    
    # Check arguments
    args, kwargs = client.client.chat.completions.create.call_args
    assert kwargs["model"] == "llama-3-8b-8192"
    assert len(kwargs["messages"]) == 2
    assert kwargs["messages"][0]["role"] == "system"
    assert kwargs["messages"][1]["role"] == "user"

@pytest.mark.asyncio
async def test_enhance_bullet(client, mock_groq):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Enhanced Bullet"))]
    client.client.chat.completions.create.return_value = mock_response
    
    result = await client.enhance_bullet("Original Bullet")
    assert result == "Enhanced Bullet"

@pytest.mark.asyncio
async def test_enhance_bullet_with_jd(client, mock_groq):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Enhanced Bullet"))]
    client.client.chat.completions.create.return_value = mock_response
    
    await client.enhance_bullet("Original Bullet", "Job Description")
    
    args, kwargs = client.client.chat.completions.create.call_args
    assert "Job Description" in kwargs["messages"][0]["content"]

@pytest.mark.asyncio
async def test_generate_interview_prep(client, mock_groq):
    mock_content = '{"questions": [{"question": "Q1", "suggested_answer": "A1", "key_points": ["P1"]}]}'
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content=mock_content))]
    client.client.chat.completions.create.return_value = mock_response
    
    result = await client.generate_interview_prep("Candidate Info", "Job Description")
    assert len(result) == 1
    assert result[0]["question"] == "Q1"

@pytest.mark.asyncio
async def test_generate_interview_prep_failure(client, mock_groq):
    # Simulate invalid JSON response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Invalid JSON"))]
    client.client.chat.completions.create.return_value = mock_response
    
    result = await client.generate_interview_prep("Candidate Info")
    assert result == []

@pytest.mark.asyncio
async def test_suggest_skills(client, mock_groq):
    mock_content = '{"skills": ["Python", "Docker"]}'
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content=mock_content))]
    client.client.chat.completions.create.return_value = mock_response
    
    result = await client.suggest_skills("I wrote backend code")
    assert "Python" in result
    assert "Docker" in result

def test_format_candidate_info(client):
    experiences = [
        Experience(
            id="e1",
            company="Tech Corp",
            title="Dev",
            startDate=datetime(2022, 1, 1),
            current=True,
            description="Desc",
            highlights=["H1"]
        )
    ]
    projects = [
        Project(
            id="p1",
            name="Proj 1",
            description="Desc",
            technologies=["Python"]
        )
    ]
    skills = [
        Skill(id="s1", name="Python", category="Lang")
    ]
    educations = [
        Education(
            id="edu1",
            institution="Uni",
            degree="BS",
            field="CS",
            startDate=datetime(2016, 1, 1)
        )
    ]
    
    formatted = client.format_candidate_info(
        name="John Doe",
        email="john@example.com",
        experiences=experiences,
        projects=projects,
        skills=skills,
        educations=educations
    )
    
    assert "John Doe" in formatted
    assert "Tech Corp" in formatted
    assert "Dev" in formatted
    assert "Proj 1" in formatted
    assert "Python" in formatted
    assert "Uni" in formatted
