"""
Cover Letter Router
API endpoint for generating tailored cover letters.
"""

import time
from fastapi import APIRouter, HTTPException, Depends

from app.models.cover_letter import CoverLetterRequest, CoverLetterResponse
from app.services.profile_service import ProfileService
from app.services.cover_letter_generator import CoverLetterGenerator
from app.utils.logger import logger, get_request_id, log_auth_operation


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
    """
    request_id = get_request_id()
    start_time = time.time()
    
    logger.start_operation("generate_cover_letter", {
        "request_id": request_id,
        "job_description_length": len(request.job_description),
        "tone": request.tone,
        "max_words": request.max_words,
        "has_auth_token": bool(request.auth_token),
    })
    
    try:
        # Validate auth token and get user profile
        logger.info("Fetching user profile for cover letter", {"request_id": request_id})
        profile = await profile_service.get_profile(request.auth_token)
        
        if profile is None:
            logger.warning("Cover letter auth failed - invalid token", {"request_id": request_id})
            log_auth_operation("cover_letter:auth_failed", success=False)
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token",
            )
        
        logger.info("Profile fetched for cover letter", {
            "request_id": request_id,
            "user_id": profile.id,
            "experiences_count": len(profile.experiences) if profile.experiences else 0,
            "skills_count": len(profile.skills) if profile.skills else 0,
        })
        
        log_auth_operation("cover_letter:auth_success", user_id=profile.id, success=True)
        
        # Check if profile has sufficient data
        if not profile.experiences and not profile.skills:
            logger.warning("Insufficient profile data for cover letter", {
                "request_id": request_id,
                "user_id": profile.id,
            })
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
            logger.warning("Invalid tone specified", {
                "request_id": request_id,
                "tone": request.tone,
                "valid_tones": list(valid_tones),
            })
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tone. Must be one of: {', '.join(valid_tones)}",
            )
        
        # Generate cover letter
        logger.info("Starting cover letter generation", {
            "request_id": request_id,
            "user_id": profile.id,
            "tone": request.tone or "professional",
            "max_words": request.max_words or 400,
        })
        
        response = await generator.generate(
            profile=profile,
            job_description=request.job_description,
            tone=request.tone or "professional",
            max_words=request.max_words or 400,
        )
        
        duration_ms = (time.time() - start_time) * 1000
        logger.end_operation("generate_cover_letter", duration_ms, {
            "request_id": request_id,
            "user_id": profile.id,
            "success": response.success,
            "word_count": response.word_count,
            "model_used": response.model_used,
            "error": response.error,
        })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.fail_operation("generate_cover_letter", e, {"request_id": request_id, "duration_ms": duration_ms})
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")


@router.post("/cover-letter/preview")
async def preview_prompt(
    request: CoverLetterRequest,
    profile_service: ProfileService = Depends(get_profile_service),
    generator: CoverLetterGenerator = Depends(get_cover_letter_generator),
) -> dict:
    """
    Preview the prompt that would be sent to the LLM.
    """
    request_id = get_request_id()
    start_time = time.time()
    
    logger.start_operation("preview_cover_letter_prompt", {"request_id": request_id})
    
    try:
        profile = await profile_service.get_profile(request.auth_token)
        
        if profile is None:
            logger.warning("Preview auth failed", {"request_id": request_id})
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token",
            )
        
        logger.info("Profile fetched for preview", {"request_id": request_id, "user_id": profile.id})
        
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
        
        logger.debug("Relevance scoring complete for preview", {
            "request_id": request_id,
            "selected_experiences": len(selected["experiences"]),
            "selected_projects": len(selected["projects"]),
            "selected_skills": len(selected["skills"]),
        })
        
        candidate_info = generator.groq_client.format_candidate_info(
            name=profile.name or "Candidate",
            email=profile.email,
            experiences=selected["experiences"],
            projects=selected["projects"],
            skills=selected["skills"],
            educations=selected["educations"],
        )
        
        duration_ms = (time.time() - start_time) * 1000
        logger.end_operation("preview_cover_letter_prompt", duration_ms, {
            "request_id": request_id,
            "user_id": profile.id,
            "candidate_info_length": len(candidate_info),
        })
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.fail_operation("preview_cover_letter_prompt", e, {"request_id": request_id})
        raise
