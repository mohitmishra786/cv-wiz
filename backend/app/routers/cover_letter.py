"""
Cover Letter Router
API endpoint for generating tailored cover letters.
"""

from fastapi import APIRouter, HTTPException, Depends

from app.models.cover_letter import CoverLetterRequest, CoverLetterResponse
from app.services.profile_service import ProfileService
from app.services.cover_letter_generator import CoverLetterGenerator


router = APIRouter()


# Dependency injection
def get_profile_service() -> ProfileService:
    return ProfileService()


def get_cover_letter_generator() -> CoverLetterGenerator:
    return CoverLetterGenerator()


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    request: CoverLetterRequest,
    profile_service: ProfileService = Depends(get_profile_service),
    generator: CoverLetterGenerator = Depends(get_cover_letter_generator),
) -> CoverLetterResponse:
    """
    Generate a tailored cover letter based on user profile and job description.
    
    Request Body:
        - auth_token: JWT authentication token
        - job_description: Job posting text (50-50000 chars)
        - tone: Optional tone (professional, enthusiastic, formal)
        - max_words: Optional max word count (100-1000)
    
    Returns:
        - success: Boolean indicating success
        - cover_letter: Generated cover letter text
        - word_count: Word count of generated letter
        - model_used: LLM model used for generation
        - profile_fields_used: Which profile sections were included
        - error: Error message (if failed)
    
    Note:
        The generated cover letter uses ONLY information from the user's
        profile. No facts are hallucinated or invented.
    """
    # Validate auth token and get user profile
    profile = await profile_service.get_profile(request.auth_token)
    
    if profile is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )
    
    # Check if profile has sufficient data
    if not profile.experiences and not profile.skills:
        raise HTTPException(
            status_code=400,
            detail=(
                "Profile needs at least some experiences or skills "
                "to generate a meaningful cover letter."
            ),
        )
    
    # Validate tone
    valid_tones = {"professional", "enthusiastic", "formal"}
    if request.tone and request.tone not in valid_tones:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tone. Must be one of: {', '.join(valid_tones)}",
        )
    
    # Generate cover letter
    response = await generator.generate(
        profile=profile,
        job_description=request.job_description,
        tone=request.tone or "professional",
        max_words=request.max_words or 400,
    )
    
    return response


@router.post("/cover-letter/preview")
async def preview_prompt(
    request: CoverLetterRequest,
    profile_service: ProfileService = Depends(get_profile_service),
    generator: CoverLetterGenerator = Depends(get_cover_letter_generator),
) -> dict:
    """
    Preview the prompt that would be sent to the LLM.
    Useful for debugging and transparency.
    
    Returns:
        - candidate_info: Formatted candidate information
        - job_description: The provided job description
    """
    profile = await profile_service.get_profile(request.auth_token)
    
    if profile is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )
    
    # Import scorer to get relevant items
    from app.utils.relevance_scorer import RelevanceScorer
    
    scorer = RelevanceScorer(request.job_description)
    selected = scorer.select_top_items(
        profile,
        max_experiences=3,
        max_projects=2,
        max_skills=10,
        max_education=1,
        max_publications=1,
    )
    
    candidate_info = generator.groq_client.format_candidate_info(
        name=profile.name or "Candidate",
        email=profile.email,
        experiences=selected["experiences"],
        projects=selected["projects"],
        skills=selected["skills"],
        educations=selected["educations"],
    )
    
    return {
        "candidate_info": candidate_info,
        "job_description": request.job_description,
        "selected_items": {
            "experiences": len(selected["experiences"]),
            "projects": len(selected["projects"]),
            "skills": len(selected["skills"]),
            "educations": len(selected["educations"]),
        },
    }
