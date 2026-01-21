"""
Cover Letter Generator Service
Orchestrates cover letter generation using Groq LLM.
"""

import time
from typing import Optional

from app.models.user import UserProfile
from app.models.cover_letter import CoverLetterResponse
from app.services.groq_client import GroqClient
from app.utils.relevance_scorer import RelevanceScorer
from app.utils.redis_cache import get_cached, set_cached, generate_cache_key
from app.utils.logger import logger, get_request_id, log_cache_operation, log_llm_request


class CoverLetterGenerator:
    """
    Generates tailored cover letters using LLM.
    
    Process:
    1. Score profile items by relevance
    2. Select most relevant items to include in prompt
    3. Format structured prompt with anti-hallucination measures
    4. Call Groq API
    5. Return generated text
    """
    
    def __init__(self):
        """Initialize cover letter generator."""
        self.groq_client = GroqClient()
        logger.info("CoverLetterGenerator initialized")
    
    async def generate(
        self,
        profile: UserProfile,
        job_description: str,
        tone: str = "professional",
        max_words: int = 400,
        use_cache: bool = True,
    ) -> CoverLetterResponse:
        """
        Generate a tailored cover letter.
        """
        request_id = get_request_id()
        start_time = time.time()
        
        logger.start_operation("CoverLetterGenerator.generate", {
            "request_id": request_id,
            "user_id": profile.id,
            "job_description_length": len(job_description),
            "tone": tone,
            "max_words": max_words,
            "use_cache": use_cache,
        })
        try:
            # Check cache
            if use_cache:
                cache_key = generate_cache_key(profile.id, job_description, "cover")
                logger.debug("Checking cache for cover letter", {"request_id": request_id, "cache_key": cache_key[:50]})
                
                cached = await get_cached(cache_key)
                if cached:
                    log_cache_operation("get", cache_key, hit=True)
                    logger.info("Cache hit - returning cached cover letter", {"request_id": request_id, "user_id": profile.id})
                    return CoverLetterResponse(**cached)
                
                log_cache_operation("get", cache_key, hit=False)
                logger.debug("Cache miss", {"request_id": request_id})
        
            # Score and select relevant items
            logger.info("Starting relevance scoring for cover letter", {
                "request_id": request_id,
                "experiences_count": len(profile.experiences) if profile.experiences else 0,
                "projects_count": len(profile.projects) if profile.projects else 0,
                "skills_count": len(profile.skills) if profile.skills else 0,
            })
            
            scorer = RelevanceScorer(job_description)
            selected = scorer.select_top_items(
                profile,
                max_experiences=3,
                max_projects=2,
                max_skills=10,
                max_education=1,
                max_publications=1,
            )
            
            logger.info("Relevance scoring complete", {
                "request_id": request_id,
                "selected_experiences": len(selected["experiences"]),
                "selected_projects": len(selected["projects"]),
                "selected_skills": len(selected["skills"]),
            })
            
            # Format candidate info for LLM
            logger.debug("Formatting candidate info", {"request_id": request_id})
            candidate_info = self.groq_client.format_candidate_info(
                name=profile.name or "Candidate",
                email=profile.email,
                experiences=selected["experiences"],
                projects=selected["projects"],
                skills=selected["skills"],
                educations=selected["educations"],
            )
            
            logger.debug("Candidate info formatted", {
                "request_id": request_id,
                "candidate_info_length": len(candidate_info),
            })
            
            # Track which fields were used
            profile_fields_used = []
            if selected["experiences"]:
                profile_fields_used.append("experiences")
            if selected["projects"]:
                profile_fields_used.append("projects")
            if selected["skills"]:
                profile_fields_used.append("skills")
            if selected["educations"]:
                profile_fields_used.append("educations")
            if selected["publications"]:
                profile_fields_used.append("publications")
            
            # Generate cover letter
            logger.info("Calling Groq LLM for cover letter generation", {
                "request_id": request_id,
                "tone": tone,
                "max_words": max_words,
            })
            
            llm_start = time.time()
            cover_letter, model_used = await self.groq_client.generate_cover_letter(
                candidate_info=candidate_info,
                job_description=job_description,
                tone=tone,
                max_words=max_words,
            )
            llm_duration = (time.time() - llm_start) * 1000
            
            word_count = len(cover_letter.split())
            log_llm_request(
                model=model_used,
                operation="generate_cover_letter",
                tokens_in=len(candidate_info) + len(job_description),
                tokens_out=word_count,
                duration_ms=llm_duration,
            )
            
            logger.info("Cover letter generated", {
                "request_id": request_id,
                "model_used": model_used,
                "word_count": word_count,
                "duration_ms": round(llm_duration, 2),
            })

            
            response = CoverLetterResponse(
                success=True,
                cover_letter=cover_letter,
                word_count=word_count,
                model_used=model_used,
                profile_fields_used=profile_fields_used,
            )
            
            # Cache successful result
            if use_cache:
                logger.debug("Caching cover letter result", {"request_id": request_id})
                await set_cached(
                    cache_key,
                    response.model_dump(mode="json"),
                )
                log_cache_operation("set", cache_key, hit=True)
            
            duration_ms = (time.time() - start_time) * 1000
            logger.end_operation("CoverLetterGenerator.generate", duration_ms, {
                "request_id": request_id,
                "user_id": profile.id,
                "success": True,
                "word_count": word_count,
            })
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.fail_operation("CoverLetterGenerator.generate", e, {
                "request_id": request_id,
                "duration_ms": duration_ms,
            })
            return CoverLetterResponse(
                success=False,
                error=f"Cover letter generation failed: {str(e)}",
            )
