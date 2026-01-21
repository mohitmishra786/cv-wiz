"""
Resume Parser Service
Extracts structured data from uploaded resume files (PDF/DOCX)
Uses PyMuPDF (fitz) for PDF parsing and LLM for structuring
"""

import io
import re
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from app.utils.logger import logger, log_function_call
from app.config import get_settings

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("[ResumeParser] PyMuPDF not installed, PDF parsing will be limited")


@dataclass
class ExtractedExperience:
    """Structured experience data extracted from resume"""
    company: str
    title: str
    start_date: str
    end_date: Optional[str]
    current: bool
    description: str
    highlights: List[str]


@dataclass
class ExtractedEducation:
    """Structured education data extracted from resume"""
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: Optional[str]


@dataclass
class ExtractedData:
    """Complete extracted resume data"""
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    experiences: List[ExtractedExperience]
    education: List[ExtractedEducation]
    skills: List[str]


class ResumeParser:
    """
    Resume parsing service that extracts structured data from PDF/DOCX files.
    """
    
    def __init__(self):
        self.settings = get_settings()
        logger.info("[ResumeParser] Initialized", {
            "pymupdf_available": PYMUPDF_AVAILABLE,
            "groq_configured": bool(self.settings.groq_api_key),
        })
    
    @log_function_call
    async def parse_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parse a resume file and extract structured data.
        
        Args:
            file_content: Raw bytes of the uploaded file
            filename: Original filename for type detection
            
        Returns:
            Dictionary containing extracted resume data
        """
        start_time = time.time()
        logger.start_operation("resume_parse", {
            "filename": filename,
            "file_size": len(file_content),
        })
        
        try:
            # Determine file type and extract text
            if filename.lower().endswith('.pdf'):
                text = self._extract_text_from_pdf(file_content)
            elif filename.lower().endswith(('.docx', '.doc')):
                text = self._extract_text_from_docx(file_content)
            else:
                logger.warning("[ResumeParser] Unsupported file type", {"filename": filename})
                return {"error": "Unsupported file type. Please upload PDF or DOCX."}
            
            logger.info("[ResumeParser] Text extracted", {
                "text_length": len(text),
                "filename": filename,
            })
            
            if not text or len(text.strip()) < 50:
                logger.warning("[ResumeParser] Insufficient text extracted", {
                    "text_length": len(text) if text else 0,
                })
                return {
                    "error": "Could not extract enough text from the file.",
                    "extracted_text_preview": text[:200] if text else None,
                }
            
            # Structure the extracted text using LLM or regex
            structured_data = await self._structure_resume_text(text)
            
            duration_ms = (time.time() - start_time) * 1000
            logger.end_operation("resume_parse", duration_ms, {
                "filename": filename,
                "experiences_found": len(structured_data.get("experiences", [])),
                "skills_found": len(structured_data.get("skills", [])),
                "education_found": len(structured_data.get("education", [])),
            })
            
            return structured_data
            
        except Exception as e:
            logger.fail_operation("resume_parse", e, {"filename": filename})
            return {"error": f"Failed to parse resume: {str(e)}"}
    
    def _extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from a PDF file using PyMuPDF."""
        logger.debug("[ResumeParser] Extracting text from PDF")
        
        if not PYMUPDF_AVAILABLE:
            logger.error("[ResumeParser] PyMuPDF not available")
            raise ImportError("PyMuPDF is required for PDF parsing. Install with: pip install PyMuPDF")
        
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            text_parts = []
            
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                text_parts.append(page_text)
                logger.debug(f"[ResumeParser] Page {page_num + 1} extracted", {
                    "chars": len(page_text),
                })
            
            doc.close()
            full_text = "\n".join(text_parts)
            
            logger.info("[ResumeParser] PDF text extraction complete", {
                "total_pages": len(text_parts),
                "total_chars": len(full_text),
            })
            
            return full_text
            
        except Exception as e:
            logger.error("[ResumeParser] PDF extraction failed", {
                "error": str(e),
            }, exc_info=True)
            raise
    
    def _extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from a DOCX file."""
        logger.debug("[ResumeParser] Extracting text from DOCX")
        
        try:
            # Try using python-docx if available
            from docx import Document
            
            doc = Document(io.BytesIO(file_content))
            text_parts = []
            
            for para in doc.paragraphs:
                text_parts.append(para.text)
            
            # Also get text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text_parts.append(cell.text)
            
            full_text = "\n".join(text_parts)
            
            logger.info("[ResumeParser] DOCX text extraction complete", {
                "paragraphs": len(doc.paragraphs),
                "total_chars": len(full_text),
            })
            
            return full_text
            
        except ImportError:
            logger.error("[ResumeParser] python-docx not available")
            raise ImportError("python-docx is required for DOCX parsing. Install with: pip install python-docx")
        except Exception as e:
            logger.error("[ResumeParser] DOCX extraction failed", {
                "error": str(e),
            }, exc_info=True)
            raise
    
    async def _structure_resume_text(self, text: str) -> Dict[str, Any]:
        """
        Structure raw resume text into organized data.
        Uses LLM if available, otherwise falls back to regex patterns.
        """
        logger.debug("[ResumeParser] Structuring resume text", {"text_length": len(text)})
        
        # Try LLM-based extraction first
        if self.settings.groq_api_key:
            try:
                return await self._llm_extract(text)
            except Exception as e:
                logger.warning("[ResumeParser] LLM extraction failed, falling back to regex", {
                    "error": str(e),
                })
        
        # Fallback to regex-based extraction
        return self._regex_extract(text)
    
    async def _llm_extract(self, text: str) -> Dict[str, Any]:
        """Use Groq LLM to extract structured data from resume text."""
        from groq import Groq
        
        logger.start_operation("llm_resume_extract")
        start_time = time.time()
        
        client = Groq(api_key=self.settings.groq_api_key)
        
        prompt = f"""Extract structured data from the following resume text. Return ONLY a valid JSON object with this exact structure:

{{
    "name": "Full name of the person or null if not found",
    "email": "Email address or null if not found",
    "phone": "Phone number or null if not found",
    "experiences": [
        {{
            "company": "Company name",
            "title": "Job title",
            "start_date": "YYYY-MM format or YYYY",
            "end_date": "YYYY-MM format or YYYY or null if current",
            "current": true/false,
            "description": "Brief description of role",
            "highlights": ["Achievement 1", "Achievement 2"]
        }}
    ],
    "education": [
        {{
            "institution": "School/University name",
            "degree": "Degree type (Bachelor's, Master's, etc.)",
            "field": "Field of study",
            "start_date": "YYYY",
            "end_date": "YYYY or null if current"
        }}
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"]
}}

Resume text:
{text[:8000]}

Return ONLY the JSON object, no markdown formatting or explanation."""

        try:
            response = client.chat.completions.create(
                model=self.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a resume parser. Extract structured data and return valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=2000,
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up potential markdown formatting
            if content.startswith("```"):
                content = re.sub(r'^```\w*\n?', '', content)
                content = re.sub(r'\n?```$', '', content)
            
            result = json.loads(content)
            
            duration_ms = (time.time() - start_time) * 1000
            logger.end_operation("llm_resume_extract", duration_ms, {
                "model": self.settings.groq_model,
                "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else None,
            })
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error("[ResumeParser] Failed to parse LLM response as JSON", {
                "error": str(e),
                "response_preview": content[:500] if content else None,
            })
            raise
    
    def _regex_extract(self, text: str) -> Dict[str, Any]:
        """Fallback regex-based extraction for basic resume parsing."""
        logger.info("[ResumeParser] Using regex extraction")
        
        result = {
            "name": None,
            "email": None,
            "phone": None,
            "experiences": [],
            "education": [],
            "skills": [],
            "warning": "Using basic extraction. Results may be incomplete.",
        }
        
        # Extract email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_match:
            result["email"] = email_match.group()
            logger.debug("[ResumeParser] Email found", {"email": result["email"]})
        
        # Extract phone
        phone_match = re.search(r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}', text)
        if phone_match:
            result["phone"] = phone_match.group()
            logger.debug("[ResumeParser] Phone found", {"phone": result["phone"]})
        
        # Extract skills (common patterns)
        skills_section = re.search(r'(?:skills?|technical skills?|technologies?)[:\s]*([^\n]+(?:\n[^\n]+)*)', text, re.IGNORECASE)
        if skills_section:
            skills_text = skills_section.group(1)
            # Split by common delimiters
            skills = re.split(r'[,|•·\n]', skills_text)
            result["skills"] = [s.strip() for s in skills if s.strip() and len(s.strip()) < 50][:20]
            logger.debug("[ResumeParser] Skills found", {"count": len(result["skills"])})
        
        logger.info("[ResumeParser] Regex extraction complete", {
            "has_email": bool(result["email"]),
            "has_phone": bool(result["phone"]),
            "skills_count": len(result["skills"]),
        })
        
        return result


# Singleton instance
resume_parser = ResumeParser()
