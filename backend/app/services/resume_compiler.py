"""
Resume Compiler Service
Orchestrates the resume compilation process.
"""

from typing import Optional

from app.models.user import UserProfile
from app.models.resume import CompiledResume, TemplateType, ResumeResponse
from app.utils.relevance_scorer import RelevanceScorer
from app.utils import PDFGenerator, PDF_AVAILABLE
from app.utils.redis_cache import get_cached, set_cached, generate_cache_key
from app.config import get_settings


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
    
    Process:
    1. Fetch user profile
    2. Score items by relevance to job description
    3. Select top items within template constraints
    4. Generate PDF
    """
    
    def __init__(self):
        """Initialize resume compiler with dependencies."""
        self.pdf_generator = PDFGenerator() if PDF_AVAILABLE else None
        self.settings = get_settings()
    
    async def compile(
        self,
        profile: UserProfile,
        job_description: str,
        template: Optional[TemplateType] = None,
        use_cache: bool = True,
    ) -> ResumeResponse:
        """
        Compile a tailored resume for the given profile and job description.
        
        Args:
            profile: User's complete profile
            job_description: Job posting text
            template: Template to use (or user's saved preference)
            use_cache: Whether to check/use cache
        
        Returns:
            ResumeResponse with PDF and/or error
        """
        # Determine template to use
        if template is None:
            template = (
                profile.settings.selected_template
                if profile.settings
                else "experience-skills-projects"
            )
        
        # Check cache
        if use_cache:
            cache_key = generate_cache_key(profile.id, job_description, "resume")
            cached = await get_cached(cache_key)
            if cached:
                return ResumeResponse(**cached)
        
        try:
            # Score and select items
            scorer = RelevanceScorer(job_description)
            config = TEMPLATE_CONFIGS.get(template, TEMPLATE_CONFIGS["experience-skills-projects"])
            
            selected = scorer.select_top_items(
                profile,
                max_experiences=config["max_experiences"],
                max_projects=config["max_projects"],
                max_skills=config["max_skills"],
                max_education=config["max_education"],
                max_publications=config["max_publications"],
            )
            
            # Build compiled resume
            compiled = CompiledResume(
                name=profile.name or "Candidate",
                email=profile.email,
                experiences=selected["experiences"],
                projects=selected["projects"],
                educations=selected["educations"],
                skills=selected["skills"],
                publications=selected["publications"],
                template=template,
                job_title=scorer.job_title or None,
            )
            
            # Generate PDF (if available)
            pdf_base64 = None
            if self.pdf_generator:
                pdf_base64 = self.pdf_generator.generate_pdf_base64(
                    compiled,
                    max_pages=self.settings.max_resume_pages,
                )
            
            response = ResumeResponse(
                success=True,
                pdf_base64=pdf_base64,
                resume_json=compiled,
            )
            
            # Cache successful result
            if use_cache:
                await set_cached(
                    cache_key,
                    response.model_dump(mode="json"),
                )
            
            return response
            
        except ValueError as e:
            # Page limit exceeded
            return ResumeResponse(
                success=False,
                error=str(e),
            )
        except Exception as e:
            return ResumeResponse(
                success=False,
                error=f"Resume compilation failed: {str(e)}",
            )
    
    def get_available_templates(self) -> dict[str, dict]:
        """
        Get all available templates with their configurations.
        
        Returns:
            Dict of template name to configuration
        """
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
