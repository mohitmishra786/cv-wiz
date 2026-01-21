"""
Resume Compilation Router
API endpoint for generating tailored resumes.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response

from app.models.resume import ResumeRequest, ResumeResponse
from app.services.profile_service import ProfileService
from app.services.resume_compiler import ResumeCompiler
from app.middleware.auth import verify_auth_token


router = APIRouter()


# Dependency injection for services
def get_profile_service() -> ProfileService:
    return ProfileService()


def get_resume_compiler() -> ResumeCompiler:
    return ResumeCompiler()


@router.post("/compile", response_model=ResumeResponse)
async def compile_resume(
    request: ResumeRequest,
    profile_service: ProfileService = Depends(get_profile_service),
    compiler: ResumeCompiler = Depends(get_resume_compiler),
) -> ResumeResponse:
    """
    Compile a tailored resume based on user profile and job description.
    
    Request Body:
        - auth_token: JWT authentication token
        - job_description: Job posting text (50-50000 chars)
        - template: Optional template override
    
    Returns:
        - success: Boolean indicating success
        - pdf_base64: Base64 encoded PDF (if successful)
        - resume_json: Structured resume data
        - error: Error message (if failed)
    """
    # Validate auth token and get user profile
    profile = await profile_service.get_profile(request.auth_token)
    
    if profile is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )
    
    # Check if profile has required data
    if not profile.experiences and not profile.projects and not profile.skills:
        raise HTTPException(
            status_code=400,
            detail="Profile is empty. Please add experiences, projects, or skills before generating a resume.",
        )
    
    # Compile resume
    response = await compiler.compile(
        profile=profile,
        job_description=request.job_description,
        template=request.template,
    )
    
    return response


@router.post("/compile/pdf")
async def compile_resume_pdf(
    request: ResumeRequest,
    profile_service: ProfileService = Depends(get_profile_service),
    compiler: ResumeCompiler = Depends(get_resume_compiler),
) -> Response:
    """
    Compile and return resume as direct PDF download.
    
    Returns the PDF file directly (not base64 encoded).
    """
    # Validate auth token and get user profile
    profile = await profile_service.get_profile(request.auth_token)
    
    if profile is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )
    
    if not profile.experiences and not profile.projects and not profile.skills:
        raise HTTPException(
            status_code=400,
            detail="Profile is empty.",
        )
    
    # Compile resume
    response = await compiler.compile(
        profile=profile,
        job_description=request.job_description,
        template=request.template,
    )
    
    if not response.success or not response.pdf_base64:
        raise HTTPException(
            status_code=500,
            detail=response.error or "Resume compilation failed",
        )
    
    # Decode base64 to bytes
    import base64
    pdf_bytes = base64.b64decode(response.pdf_base64)
    
    # Generate filename
    name_slug = (profile.name or "resume").replace(" ", "_").lower()
    filename = f"{name_slug}_resume.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/templates")
async def get_templates(
    compiler: ResumeCompiler = Depends(get_resume_compiler),
) -> dict:
    """
    Get available resume templates with descriptions.
    
    Returns:
        Dict of template configurations and descriptions.
    """
    return {
        "templates": compiler.get_available_templates(),
    }
