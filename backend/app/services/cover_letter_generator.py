"""
Cover Letter Generator Service
Orchestrates cover letter generation using Groq LLM.
"""

from typing import Optional

from app.models.user import UserProfile
from app.models.cover_letter import CoverLetterResponse
from app.services.groq_client import GroqClient
from app.utils.relevance_scorer import RelevanceScorer
from app.utils.redis_cache import get_cached, set_cached, generate_cache_key


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
        
        Args:
            profile: User's complete profile
            job_description: Job posting text
            tone: Desired tone (professional, enthusiastic, formal)
            max_words: Maximum word count
            use_cache: Whether to check/use cache
        
        Returns:
            CoverLetterResponse with generated text or error
        """
        # Check cache
        if use_cache:
            cache_key = generate_cache_key(profile.id, job_description, "cover")
            cached = await get_cached(cache_key)
            if cached:
                return CoverLetterResponse(**cached)
        
        try:
            # Score and select relevant items
            scorer = RelevanceScorer(job_description)
            selected = scorer.select_top_items(
                profile,
                max_experiences=3,  # Include top 3 relevant experiences
                max_projects=2,
                max_skills=10,
                max_education=1,
                max_publications=1,
            )
            
            # Format candidate info for LLM
            candidate_info = self.groq_client.format_candidate_info(
                name=profile.name or "Candidate",
                email=profile.email,
                experiences=selected["experiences"],
                projects=selected["projects"],
                skills=selected["skills"],
                educations=selected["educations"],
            )
            
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
            cover_letter, model_used = await self.groq_client.generate_cover_letter(
                candidate_info=candidate_info,
                job_description=job_description,
                tone=tone,
                max_words=max_words,
            )
            
            # Count words
            word_count = len(cover_letter.split())
            
            response = CoverLetterResponse(
                success=True,
                cover_letter=cover_letter,
                word_count=word_count,
                model_used=model_used,
                profile_fields_used=profile_fields_used,
            )
            
            # Cache successful result
            if use_cache:
                await set_cached(
                    cache_key,
                    response.model_dump(mode="json"),
                )
            
            return response
            
        except Exception as e:
            return CoverLetterResponse(
                success=False,
                error=f"Cover letter generation failed: {str(e)}",
            )
