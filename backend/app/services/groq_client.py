"""
Groq LLM Client
Wrapper for the Groq API for generating cover letters.
"""

from typing import Optional
from groq import Groq

from app.config import get_settings


class GroqClient:
    """
    Client for interacting with Groq's LLM API.
    Uses the OpenAI-compatible chat completions endpoint.
    """
    
    def __init__(self):
        """Initialize Groq client."""
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
    
    async def generate_cover_letter(
        self,
        candidate_info: str,
        job_description: str,
        tone: str = "professional",
        max_words: int = 400,
    ) -> tuple[str, str]:
        """
        Generate a cover letter using Groq's LLM.
        
        Args:
            candidate_info: Structured candidate background from profile
            job_description: Job posting text
            tone: Desired tone (professional, enthusiastic, formal)
            max_words: Maximum word count
        
        Returns:
            Tuple of (generated_text, model_used)
        """
        system_prompt = self._build_system_prompt(tone, max_words)
        user_prompt = self._build_user_prompt(candidate_info, job_description)
        
        # Use sync client in async context (Groq SDK is sync)
        # Note: In production, consider using run_in_executor for true async
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
            top_p=0.95,
        )
        
        generated_text = response.choices[0].message.content
        return generated_text.strip(), self.model
    
    def _build_system_prompt(self, tone: str, max_words: int) -> str:
        """Build system prompt for cover letter generation."""
        tone_descriptions = {
            "professional": "professional, confident, and polished",
            "enthusiastic": "enthusiastic, energetic, and passionate",
            "formal": "formal, respectful, and traditional",
        }
        
        tone_desc = tone_descriptions.get(tone, tone_descriptions["professional"])
        
        return f"""You are an expert career coach and professional resume writer.
Your task is to write compelling, ATS-friendly cover letters that:

1. STRICTLY use ONLY the information provided about the candidate
2. DO NOT invent, assume, or hallucinate any facts not in the provided data
3. Match the candidate's actual experience to the job requirements
4. Use a {tone_desc} tone
5. Follow standard cover letter structure:
   - Opening paragraph: Express interest and mention specific role
   - Body paragraphs: Connect relevant experience to job requirements
   - Closing paragraph: Call to action and gratitude
6. Keep the letter under {max_words} words
7. Be ATS-friendly: avoid tables, images, or unusual formatting
8. Use specific examples from the candidate's background
9. If a skill or experience is not in the candidate data, DO NOT mention it

IMPORTANT: You must only include facts that are explicitly stated in the candidate information.
Never add qualifications, experiences, or skills that are not provided."""
    
    def _build_user_prompt(self, candidate_info: str, job_description: str) -> str:
        """Build user prompt with candidate info and job description."""
        return f"""Please write a cover letter for this candidate applying to the position described below.

## CANDIDATE INFORMATION (use ONLY this data):
{candidate_info}

## JOB DESCRIPTION:
{job_description}

## INSTRUCTIONS:
Write a compelling cover letter that:
- Connects the candidate's ACTUAL experience to this specific role
- Uses concrete examples from their background
- Shows enthusiasm for the opportunity
- Avoids generic phrases
- NEVER includes information not in the candidate data above

Write the cover letter now:"""
    
    def format_candidate_info(
        self,
        name: str,
        email: str,
        experiences: list,
        projects: list,
        skills: list,
        educations: list,
    ) -> str:
        """
        Format candidate information for the LLM prompt.
        Uses structured format to prevent hallucination.
        
        Args:
            name: Candidate name
            email: Candidate email
            experiences: List of Experience objects
            projects: List of Project objects
            skills: List of Skill objects
            educations: List of Education objects
        
        Returns:
            Formatted string with candidate information
        """
        lines = [
            f"Name: {name}",
            f"Email: {email}",
            "",
            "### WORK EXPERIENCE:",
        ]
        
        for exp in experiences:
            lines.append(f"- {exp.title} at {exp.company}")
            if exp.location:
                lines.append(f"  Location: {exp.location}")
            lines.append(f"  Duration: {exp.start_date.strftime('%b %Y')} - {'Present' if exp.current else exp.end_date.strftime('%b %Y') if exp.end_date else 'N/A'}")
            if exp.highlights:
                for highlight in exp.highlights[:3]:
                    lines.append(f"  • {highlight}")
            lines.append("")
        
        if projects:
            lines.append("### PROJECTS:")
            for proj in projects:
                lines.append(f"- {proj.name}")
                if proj.technologies:
                    lines.append(f"  Technologies: {', '.join(proj.technologies)}")
                if proj.highlights:
                    for highlight in proj.highlights[:2]:
                        lines.append(f"  • {highlight}")
                lines.append("")
        
        if skills:
            lines.append("### SKILLS:")
            skills_by_category = {}
            for skill in skills:
                if skill.category not in skills_by_category:
                    skills_by_category[skill.category] = []
                skills_by_category[skill.category].append(skill.name)
            
            for category, skill_names in skills_by_category.items():
                lines.append(f"- {category}: {', '.join(skill_names)}")
            lines.append("")
        
        if educations:
            lines.append("### EDUCATION:")
            for edu in educations:
                lines.append(f"- {edu.degree} in {edu.field}")
                lines.append(f"  {edu.institution}, {edu.start_date.year} - {edu.end_date.year if edu.end_date else 'Present'}")
                if edu.gpa:
                    lines.append(f"  GPA: {edu.gpa:.2f}")
                if edu.honors:
                    lines.append(f"  Honors: {', '.join(edu.honors)}")
                lines.append("")
        
        return "\n".join(lines)
