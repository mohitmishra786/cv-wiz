
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
from app.main import app
from app.routers.compile import get_profile_service as get_ps_compile, get_resume_compiler
from app.routers.cover_letter import get_profile_service as get_ps_cl, get_cover_letter_generator
from app.routers.upload import router as upload_router
from app.models.user import UserProfile, Experience, Skill, UserSettings
from app.models.resume import CompiledResume, ResumeResponse
from app.models.cover_letter import CoverLetterResponse

# Include upload router for testing
app.include_router(upload_router, prefix="")

# Fixtures for mocks
@pytest.fixture
def mock_profile_service():
    mock = MagicMock()
    mock.get_profile = AsyncMock()
    return mock

@pytest.fixture
def mock_compiler():
    mock = MagicMock()
    mock.compile = AsyncMock()
    mock.get_available_templates.return_value = {"template1": {"description": "desc"}}
    return mock

@pytest.fixture
def mock_cl_generator():
    mock = MagicMock()
    mock.generate = AsyncMock()
    # For preview endpoint
    mock.groq_client = MagicMock()
    mock.groq_client.format_candidate_info.return_value = "Formatted Info"
    return mock

@pytest.fixture
def client(mock_profile_service, mock_compiler, mock_cl_generator):
    # Override dependencies for ALL endpoints
    app.dependency_overrides[get_ps_compile] = lambda: mock_profile_service
    app.dependency_overrides[get_ps_cl] = lambda: mock_profile_service
    app.dependency_overrides[get_resume_compiler] = lambda: mock_compiler
    app.dependency_overrides[get_cover_letter_generator] = lambda: mock_cl_generator
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides = {}

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
                title="Dev",
                startDate="2022-01-01T00:00:00Z",
                description="Desc",
                keywords=["Python"]
            )
        ],
        projects=[],
        skills=[Skill(id="s1", name="Python", category="Lang")],
        educations=[],
        publications=[]
    )

def test_compile_resume(client, mock_profile_service, mock_compiler, sample_profile):
    mock_profile_service.get_profile.return_value = sample_profile
    mock_compiler.compile.return_value = ResumeResponse(
        success=True,
        pdf_base64="base64pdf",
        resume_json=CompiledResume(
            name="Test",
            email="test",
            template="experience-skills-projects"
        )
    )
    
    response = client.post("/compile", json={
        "authToken": "valid_token",
        "jobDescription": "A" * 60 # > 50 chars
    })
    
    assert response.status_code == 200
    assert response.json()["success"]
    assert response.json()["pdfBase64"] == "base64pdf"

def test_compile_resume_invalid_jd(client):
    response = client.post("/compile", json={
        "authToken": "token",
        "jobDescription": "Short"
    })
    # Pydantic validation error (422) happens before endpoint logic (400)
    assert response.status_code == 422

def test_generate_cover_letter(client, mock_profile_service, mock_cl_generator, sample_profile):
    mock_profile_service.get_profile.return_value = sample_profile
    mock_cl_generator.generate.return_value = CoverLetterResponse(
        success=True,
        cover_letter="My Cover Letter",
        word_count=100,
        model_used="model",
        profile_fields_used=["experiences"]
    )
    
    response = client.post("/cover-letter", json={
        "authToken": "token",
        "jobDescription": "A" * 60,
        "tone": "professional"
    })
    
    assert response.status_code == 200
    assert response.json()["success"]
    assert response.json()["coverLetter"] == "My Cover Letter"


# ============================================================================
# Upload Endpoint Tests
# ============================================================================

@pytest.fixture
def mock_resume_parser():
    mock = MagicMock()
    mock.parse_file = AsyncMock()
    return mock


@pytest.fixture
def upload_client(mock_resume_parser):
    with patch('app.routers.upload.resume_parser', mock_resume_parser):
        with TestClient(app) as c:
            yield c


def test_upload_resume_requires_auth(upload_client):
    """Test that upload endpoint requires authentication."""
    response = upload_client.post(
        "/upload/resume",
        files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
    )
    
    # FastAPI returns 422 for missing required form field
    assert response.status_code == 422


def test_upload_resume_rejects_invalid_token(upload_client):
    """Test that upload endpoint rejects invalid auth tokens."""
    response = upload_client.post(
        "/upload/resume",
        files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
        data={"auth_token": "invalid_token"},
    )
    
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]


def test_upload_resume_accepts_valid_token(upload_client, mock_resume_parser):
    """Test that upload endpoint accepts valid auth tokens."""
    import jwt
    from app.config import get_settings
    
    settings = get_settings()
    
    # Create a valid JWT token
    payload = {"sub": "test_user_123", "email": "test@example.com"}
    token = jwt.encode(payload, settings.nextauth_secret, algorithm="HS256")
    
    # Mock the resume parser response
    mock_resume_parser.parse_file.return_value = {
        "success": True,
        "name": "John Doe",
        "experiences": [{"title": "Developer", "company": "Tech Corp"}],
        "skills": [{"name": "Python", "category": "Language"}],
        "education": [],
        "extraction_method": "groq",
    }
    
    response = upload_client.post(
        "/upload/resume",
        files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
        data={"auth_token": token, "file_type": "resume"},
    )
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "John Doe"


def test_parse_resume_alt_requires_auth(upload_client):
    """Test that parse-resume endpoint requires authentication."""
    response = upload_client.post(
        "/parse-resume",
        files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
    )
    
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


def test_parse_cover_letter_requires_auth(upload_client):
    """Test that parse-cover-letter endpoint requires authentication."""
    response = upload_client.post(
        "/parse-cover-letter",
        files={"file": ("cover.pdf", b"fake pdf content", "application/pdf")},
    )
    
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]
