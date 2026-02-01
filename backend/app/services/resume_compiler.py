"""
Resume Compiler Service
Orchestrates the resume compilation process.
"""

import time
from concurrent.futures import ProcessPoolExecutor
from typing import Optional

from app.models.user import UserProfile
from app.models.resume import CompiledResume, TemplateType, ResumeResponse
from app.utils.relevance_scorer import RelevanceScorer
from app.utils import PDFGenerator, PDF_AVAILABLE
from app.utils.redis_cache import get_cached, set_cached, generate_cache_key
from app.config import get_settings
from app.utils.logger import logger, get_request_id, log_cache_operation


# Process pool for CPU-bound PDF generation
_pdf_executor = ProcessPoolExecutor(max_workers=4)


# Template configurations defining what sections to include and limits
TEMPLATE_CONFIGS = {
    "experience-skills-projects": {
        "max_experiences": 3,
        "max_projects": 2,
        "max_skills": 12,
        "max_education": 1,
        "max_publications": 0,
        "section_order": ["experiences", "skills", "projects", "educations"],
    },
    "education-research-skills": {
        "max_experiences": 2,
        "max_projects": 1,
        "max_skills": 10,
        "max_education": 2,
        "max_publications": 3,
        "section_order": ["educations", "publications", "experiences", "skills"],
    },
    "projects-skills-experience": {
        "max_experiences": 2,
        "max_projects": 4,
        "max_skills": 10,
        "max_education": 1,
        "max_publications": 0,
        "section_order": ["projects", "skills", "experiences", "educations"],
    },
    "compact-technical": {
        "max_experiences": 2,
        "max_projects": 2,
        "max_skills": 15,
        "max_education": 1,
        "max_publications": 0,
        "section_order": ["skills", "experiences", "projects", "educations"],
    },
}


class ResumeCompiler:
    """
    Compiles tailored resumes from user profiles based on job descriptions.
    """
    
    def __init__(self):
        """Initialize resume compiler with dependencies."""
        self.pdf_generator = PDFGenerator() if PDF_AVAILABLE else None
        self.settings = get_settings()
        logger.info("ResumeCompiler initialized", {
            "pdf_available": PDF_AVAILABLE,
            "max_resume_pages": self.settings.max_resume_pages,
        })
    
    async def compile(
        self,
        profile: UserProfile,
        job_description: str,
        template: Optional[TemplateType] = None,
        use_cache: bool = True,
    ) -> ResumeResponse:
        """
        Compile a tailored resume for the given profile and job description.
        """
        request_id = get_request_id()
        start_time = time.time()
        
        logger.start_operation("ResumeCompiler.compile", {
            "request_id": request_id,
            "user_id": profile.id,
            "job_description_length": len(job_description),
            "template_requested": template,
            "use_cache": use_cache,
        })
        
        # Prepare cache key if needed
        cache_key = generate_cache_key(profile.id, job_description, "resume")
        
        try:
            # Determine template to use
            if template is None:
                template_val: TemplateType = (
                    profile.settings.selected_template
                    if profile.settings
                    else "experience-skills-projects"
                )
            else:
                template_val = template
            
            logger.debug("Template selected", {
                "request_id": request_id,
                "template": template_val,
                "from_profile_settings": template is None,
            })
            
            # Check cache
            if use_cache:
                logger.debug("Checking cache", {"request_id": request_id, "cache_key": cache_key[:50]})
                
                cached = await get_cached(cache_key)
                if cached:
                    log_cache_operation("get", cache_key, hit=True)
                    logger.info("Cache hit - returning cached resume", {
                        "request_id": request_id,
                        "user_id": profile.id,
                    })
                    return ResumeResponse(**cached)
                
                log_cache_operation("get", cache_key, hit=False)
                logger.debug("Cache miss", {"request_id": request_id})
            
            # Score and select items
            logger.info("Starting relevance scoring", {
                "request_id": request_id,
                "experiences_count": len(profile.experiences) if profile.experiences else 0,
                "projects_count": len(profile.projects) if profile.projects else 0,
                "skills_count": len(profile.skills) if profile.skills else 0,
            })
            
            scorer = RelevanceScorer(job_description)
            config = TEMPLATE_CONFIGS.get(str(template_val), TEMPLATE_CONFIGS["experience-skills-projects"])
            
            selected = scorer.select_top_items(
                profile,
                max_experiences=config["max_experiences"],
                max_projects=config["max_projects"],
                max_skills=config["max_skills"],
                max_education=config["max_education"],
                max_publications=config["max_publications"],
            )
            
            logger.info("Relevance scoring complete", {
                "request_id": request_id,
                "selected_experiences": len(selected["experiences"]),
                "selected_projects": len(selected["projects"]),
                "selected_skills": len(selected["skills"]),
                "selected_educations": len(selected["educations"]),
                "job_title_extracted": scorer.job_title,
            })
            
            # Build compiled resume
            compiled = CompiledResume(
                name=profile.name or "Candidate",
                email=profile.email or "",
                experiences=selected["experiences"],
                projects=selected["projects"],
                educations=selected["educations"],
                skills=selected["skills"],
                publications=selected["publications"],
                template=template_val,
                job_title=scorer.job_title or None,
            )
            
            # Generate PDF (if available)
            pdf_base64 = None
            pdf_error = None
            
            if self.pdf_generator:
                logger.info("Generating PDF", {"request_id": request_id})
                pdf_start = time.time()
                
                try:
                    # Use ProcessPoolExecutor for CPU-bound PDF generation
                    # This avoids blocking the event loop and allows true parallelism
                    loop = __import__('asyncio').get_event_loop()
                    pdf_base64 = await loop.run_in_executor(
                        _pdf_executor,
                        self.pdf_generator.generate_pdf_base64,
                        compiled,
                        self.settings.max_resume_pages
                    )
                    
                    pdf_duration = (time.time() - pdf_start) * 1000
                    logger.info("PDF generation complete", {
                        "request_id": request_id,
                        "duration_ms": round(pdf_duration, 2),
                        "pdf_size_bytes": len(pdf_base64) if pdf_base64 else 0,
                    })
                except Exception as pdf_e:
                    pdf_duration = (time.time() - pdf_start) * 1000
                    pdf_error = str(pdf_e)
                    logger.error("PDF generation failed", {
                        "request_id": request_id,
                        "error": pdf_error,
                        "duration_ms": round(pdf_duration, 2),
                    })
                    # Don't fail the entire request - return JSON-only response
            else:
                logger.warning("PDF generator not available", {"request_id": request_id})
                pdf_error = "PDF generation is not available. Please ensure WeasyPrint dependencies are installed."
            
            # Build response - success if we have at least JSON data
            response_success = True
            response_error = None
            
            if not pdf_base64 and pdf_error:
                # PDF failed but we still have JSON data
                response_error = f"Resume compiled successfully but PDF generation failed: {pdf_error}"
                logger.warning("Returning partial response - PDF unavailable", {
                    "request_id": request_id,
                    "error": pdf_error,
                })
            
            response = ResumeResponse(
                success=response_success,
                pdf_base64=pdf_base64,
                resume_json=compiled,
                error=response_error,
            )
            
            # Cache successful result
            if use_cache:
                logger.debug("Caching result", {"request_id": request_id})
                await set_cached(
                    cache_key,
                    response.model_dump(mode="json"),
                )
                log_cache_operation("set", cache_key, hit=True)
            
            duration_ms = (time.time() - start_time) * 1000
            logger.end_operation("ResumeCompiler.compile", duration_ms, {
                "request_id": request_id,
                "user_id": profile.id,
                "success": True,
                "has_pdf": bool(pdf_base64),
            })
            
            return response
            
        except ValueError as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.warning("Resume compilation value error", {
                "request_id": request_id,
                "error": str(e),
                "duration_ms": duration_ms,
            })
            return ResumeResponse(
                success=False,
                error=str(e),
            )
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.fail_operation("ResumeCompiler.compile", e, {
                "request_id": request_id,
                "duration_ms": duration_ms,
            })
            return ResumeResponse(
                success=False,
                error=f"Resume compilation failed: {str(e)}",
            )
    
    def get_available_templates(self) -> dict[str, dict]:
        """Get all available templates with their configurations."""
        logger.debug("Getting available templates")
        return {
            name: {
                **config,
                "description": self._get_template_description(name),
            }
            for name, config in TEMPLATE_CONFIGS.items()
        }
    
    def _get_template_description(self, template: str) -> str:
        """Get human-readable description for a template."""
        descriptions = {
            "experience-skills-projects": (
                "Best for experienced professionals. Emphasizes work history "
                "and technical skills with selected projects."
            ),
            "education-research-skills": (
                "Ideal for academics, researchers, and recent graduates. "
                "Highlights education, publications, and research experience."
            ),
            "projects-skills-experience": (
                "Great for developers and makers. Leads with project portfolio "
                "and technical skills."
            ),
            "compact-technical": (
                "Maximizes technical skill visibility. Compact layout for "
                "roles requiring specific technical expertise."
            ),
        }
        return descriptions.get(template, "Custom template")
