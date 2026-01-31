from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.services.groq_client import GroqClient
from app.utils.logger import logger

router = APIRouter(prefix="/ai")

class EnhanceBulletRequest(BaseModel):
    bullet: str
    job_description: Optional[str] = None

class InterviewPrepRequest(BaseModel):
    candidate_info: str
    job_description: Optional[str] = None

class InterviewQuestion(BaseModel):
    question: str
    suggested_answer: str
    key_points: List[str]

class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestion]

class SkillSuggestionRequest(BaseModel):
    experience_text: str

class SkillSuggestionResponse(BaseModel):
    skills: List[str]

@router.post("/enhance-bullet")
async def enhance_bullet(request: EnhanceBulletRequest):
    """Rewrite a resume bullet point to be more impactful and relevant."""
    try:
        client = GroqClient()
        enhanced_bullet = await client.enhance_bullet(
            bullet=request.bullet,
            job_description=request.job_description
        )
        return {"enhanced_bullet": enhanced_bullet}
    except Exception as e:
        logger.error(f"Error enhancing bullet: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to enhance bullet")

@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(request: InterviewPrepRequest):
    """Generate interview questions and answers based on candidate info and job desc."""
    try:
        client = GroqClient()
        questions = await client.generate_interview_prep(
            candidate_info=request.candidate_info,
            job_description=request.job_description
        )
        return {"questions": questions}
    except Exception as e:
        logger.error(f"Error generating interview prep: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate interview prep")

@router.post("/suggest-skills", response_model=SkillSuggestionResponse)
async def suggest_skills(request: SkillSuggestionRequest):
    """Suggest skills based on experience description."""
    if len(request.experience_text) < 10:
        raise HTTPException(status_code=400, detail="Experience text too short")
        
    try:
        client = GroqClient()
        skills = await client.suggest_skills(request.experience_text)
        return {"skills": skills}
    except Exception as e:
        logger.error(f"Error suggesting skills: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to suggest skills")
