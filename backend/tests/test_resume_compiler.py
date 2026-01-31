
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime
from app.services.resume_compiler import ResumeCompiler
from app.models.user import UserProfile, Experience, Project, Education, Skill, Publication, UserSettings

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
def mock_pdf_generator():
    with patch("app.services.resume_compiler.PDFGenerator") as mock:
        instance = mock.return_value
        instance.generate_pdf_base64.return_value = "base64encodedpdf"
        yield instance

@pytest.fixture
def mock_cache():
    with patch("app.services.resume_compiler.get_cached") as mock_get, \
         patch("app.services.resume_compiler.set_cached") as mock_set:
        mock_get.return_value = None
        yield mock_get, mock_set

@pytest.fixture
def compiler(mock_pdf_generator, mock_cache):
    with patch("app.services.resume_compiler.PDF_AVAILABLE", True):
        # We need to re-instantiate because __init__ checks PDF_AVAILABLE
        yield ResumeCompiler()

@pytest.mark.asyncio
async def test_compile_resume(compiler, sample_profile, mock_cache):
    jd = "Looking for a Python Developer."
    response = await compiler.compile(profile=sample_profile, job_description=jd)
    
    assert response.success
    assert response.resume_json is not None
    assert response.pdf_base64 == "base64encodedpdf"
    
    # Check that items were selected
    assert len(response.resume_json.experiences) > 0
    assert response.resume_json.job_title == "python developer" or "python developer" in response.resume_json.job_title

    # Verify caching behavior
    mock_get, mock_set = mock_cache
    mock_get.assert_called_once()
    mock_set.assert_called_once()

@pytest.mark.asyncio
async def test_compile_cached_resume(compiler, sample_profile, mock_cache):
    mock_get, mock_set = mock_cache
    mock_get.return_value = {
        "success": True,
        "pdf_base64": "cached_pdf",
        "resume_json": {
            "name": "Test User",
            "email": "test@example.com",
            "template": "experience-skills-projects",
            "experiences": [],
            "projects": [],
            "skills": [],
            "educations": [],
            "publications": []
        },
        "error": None
    }
    
    response = await compiler.compile(sample_profile, "jd")
    assert response.pdf_base64 == "cached_pdf"
    mock_set.assert_not_called()

@pytest.mark.asyncio
async def test_pdf_generation_failure(compiler, sample_profile, mock_pdf_generator, mock_cache):
    mock_pdf_generator.generate_pdf_base64.side_effect = Exception("PDF Error")
    
    response = await compiler.compile(sample_profile, "jd")
    assert response.success  # Still success for JSON
    assert response.pdf_base64 is None
    assert "PDF Error" in response.error

def test_get_available_templates(compiler):
    templates = compiler.get_available_templates()
    assert "experience-skills-projects" in templates
    assert "compact-technical" in templates
    assert "description" in templates["experience-skills-projects"]
