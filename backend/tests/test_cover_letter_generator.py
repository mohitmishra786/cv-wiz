
import pytest
from unittest.mock import patch, AsyncMock
from datetime import datetime
from app.services.cover_letter_generator import CoverLetterGenerator
from app.models.user import UserProfile, Experience, Project, Education, Skill, UserSettings


@pytest.fixture
def sample_profile():
    return UserProfile(
        id="u1",
        email="test@example.com",
        name="Test User",
        settings=UserSettings(selectedTemplate="experience-skills-projects"),
        experiences=[
            Experience(
                id="e1",
                company="Tech Corp",
                title="Python Developer",
                startDate=datetime(2022, 1, 1),
                current=True,
                description="Built APIs.",
                keywords=["Python"],
                highlights=["H1"]
            )
        ],
        projects=[
            Project(
                id="p1",
                name="Project 1",
                description="A Python project.",
                technologies=["Python"],
                highlights=["H2"]
            )
        ],
        skills=[
            Skill(id="s1", name="Python", category="Language")
        ],
        educations=[
            Education(
                id="edu1",
                institution="University",
                degree="BS",
                field="CS",
                startDate=datetime(2018, 1, 1),
                endDate=datetime(2022, 1, 1)
            )
        ]
    )


@pytest.fixture
def mock_groq_client():
    with patch("app.services.cover_letter_generator.GroqClient") as mock:
        instance = mock.return_value
        # Use AsyncMock for async methods
        instance.generate_cover_letter = AsyncMock(return_value=("Generated Letter", "model-id"))
        instance.format_candidate_info.return_value = "Formatted Info"
        yield instance

@pytest.fixture
def mock_cache():
    with patch("app.services.cover_letter_generator.get_cached") as mock_get, \
         patch("app.services.cover_letter_generator.set_cached") as mock_set:
        mock_get.return_value = None
        yield mock_get, mock_set

@pytest.fixture
def generator(mock_groq_client, mock_cache):
    return CoverLetterGenerator()

@pytest.mark.asyncio
async def test_generate(generator, sample_profile, mock_groq_client):
    response = await generator.generate(sample_profile, "Job Description")
    
    assert response.success
    assert response.cover_letter == "Generated Letter"
    assert response.model_used == "model-id"
    
    mock_groq_client.generate_cover_letter.assert_called_once()

@pytest.mark.asyncio
async def test_generate_cached(generator, sample_profile, mock_cache, mock_groq_client):
    mock_get, mock_set = mock_cache
    mock_get.return_value = {
        "success": True,
        "cover_letter": "Cached Letter",
        "model_used": "cached-model",
        "word_count": 100,
        "profile_fields_used": []
    }
    
    response = await generator.generate(sample_profile, "Job Description")
    assert response.cover_letter == "Cached Letter"
    mock_groq_client.generate_cover_letter.assert_not_called()

@pytest.mark.asyncio
async def test_generate_error(generator, sample_profile, mock_groq_client):
    mock_groq_client.generate_cover_letter.side_effect = Exception("Groq Error")
    
    response = await generator.generate(sample_profile, "Job Description")
    assert not response.success
    assert "Groq Error" in response.error
