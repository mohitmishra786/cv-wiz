"""
Resume Parser Service
Extracts structured data from uploaded resume files (PDF/DOCX/TXT/MD)
Uses PyMuPDF (fitz) for PDF parsing and LLM for structuring
"""

import io
import re
import json
import time
import traceback
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from app.utils.logger import logger, log_function_call
from app.config import get_settings

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("[ResumeParser] PyMuPDF not installed, PDF parsing will be limited")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("[ResumeParser] python-docx not installed, DOCX parsing will be disabled")


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
    Resume parsing service that extracts structured data from PDF/DOCX/TXT/MD files.
    """
    
    def __init__(self):
        self.settings = get_settings()
        logger.info("[ResumeParser] Initialized", {
            "pymupdf_available": PYMUPDF_AVAILABLE,
            "docx_available": DOCX_AVAILABLE,
            "groq_configured": bool(self.settings.groq_api_key),
        })
    
    @log_function_call
    async def parse_file(self, file_content: bytes, filename: str, file_type: str = "resume") -> Dict[str, Any]:
        """
        Parse a resume or cover letter file and extract structured data.
        
        Args:
            file_content: Raw bytes of the uploaded file
            filename: Original filename for type detection
            file_type: "resume" or "cover-letter"
            
        Returns:
            Dictionary containing extracted data
        """
        start_time = time.time()
        logger.start_operation("resume_parse", {
            "filename": filename,
            "file_size": len(file_content),
            "file_type": file_type,
        })
        
        try:
            # Determine file type and extract text
            filename_lower = filename.lower()
            
            if filename_lower.endswith('.pdf'):
                text = self._extract_text_from_pdf(file_content)
            elif filename_lower.endswith(('.docx', '.doc')):
                text = self._extract_text_from_docx(file_content)
            elif filename_lower.endswith(('.txt', '.md', '.markdown')):
                text = self._extract_text_from_plaintext(file_content)
            else:
                logger.warning("[ResumeParser] Unsupported file type", {"filename": filename})
                return {"error": "Unsupported file type. Please upload PDF, DOCX, TXT, or MD."}
            
            logger.info("[ResumeParser] Text extracted", {
                "text_length": len(text),
                "filename": filename,
                "preview": text[:200] if text else None,
            })
            
            if not text or len(text.strip()) < 50:
                logger.warning("[ResumeParser] Insufficient text extracted", {
                    "text_length": len(text) if text else 0,
                })
                return {
                    "error": "Could not extract enough text from the file. The file may be empty, image-only, or corrupted.",
                    "extracted_text_preview": text[:500] if text else None,
                }
            
            # For cover letters, return the raw text
            if file_type == "cover-letter":
                return {
                    "content": text.strip(),
                    "word_count": len(text.split()),
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
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] Parse failed with exception", {
                "filename": filename,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": error_traceback,
            })
            logger.fail_operation("resume_parse", e, {"filename": filename})
            return {
                "error": f"Failed to parse resume: {str(e)}",
                "error_type": type(e).__name__,
                "traceback": error_traceback if self.settings.environment == "development" else None,
            }
    
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
                # Use multiple extraction methods for better results with complex PDFs
                # Method 1: Standard text extraction
                page_text = page.get_text("text")
                
                # Method 2: If standard extraction yields little text, try blocks
                if len(page_text.strip()) < 100:
                    blocks = page.get_text("blocks")
                    block_text = "\n".join([b[4] for b in blocks if isinstance(b[4], str)])
                    if len(block_text) > len(page_text):
                        page_text = block_text
                
                text_parts.append(page_text)
                logger.debug(f"[ResumeParser] Page {page_num + 1} extracted", {
                    "chars": len(page_text),
                })
            
            doc.close()
            full_text = "\n".join(text_parts)
            
            # Clean up common PDF artifacts
            full_text = re.sub(r'\s+', ' ', full_text)  # Normalize whitespace
            full_text = re.sub(r'(\w)-\s+(\w)', r'\1\2', full_text)  # Fix hyphenation
            
            logger.info("[ResumeParser] PDF text extraction complete", {
                "total_pages": len(text_parts),
                "total_chars": len(full_text),
            })
            
            return full_text
            
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] PDF extraction failed", {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
            })
            raise
    
    def _extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from a DOCX file."""
        logger.debug("[ResumeParser] Extracting text from DOCX")
        
        if not DOCX_AVAILABLE:
            logger.error("[ResumeParser] python-docx not available")
            raise ImportError("python-docx is required for DOCX parsing. Install with: pip install python-docx")
        
        try:
            doc = Document(io.BytesIO(file_content))
            text_parts = []
            
            for para in doc.paragraphs:
                if para.text.strip():
                    text_parts.append(para.text)
            
            # Also get text from tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = []
                    for cell in row.cells:
                        if cell.text.strip():
                            row_text.append(cell.text.strip())
                    if row_text:
                        text_parts.append(" | ".join(row_text))
            
            full_text = "\n".join(text_parts)
            
            logger.info("[ResumeParser] DOCX text extraction complete", {
                "paragraphs": len(doc.paragraphs),
                "tables": len(doc.tables),
                "total_chars": len(full_text),
            })
            
            return full_text
            
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] DOCX extraction failed", {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
            })
            raise
    
    def _extract_text_from_plaintext(self, file_content: bytes) -> str:
        """Extract text from a plain text or markdown file."""
        logger.debug("[ResumeParser] Extracting text from plaintext/markdown")
        
        try:
            # Try UTF-8 first, then fall back to other encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
            
            for encoding in encodings:
                try:
                    text = file_content.decode(encoding)
                    logger.info("[ResumeParser] Plaintext extraction complete", {
                        "encoding": encoding,
                        "total_chars": len(text),
                    })
                    return text
                except UnicodeDecodeError:
                    continue
            
            # If all fail, use UTF-8 with error replacement
            text = file_content.decode('utf-8', errors='replace')
            logger.warning("[ResumeParser] Plaintext decoded with replacement characters")
            return text
            
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] Plaintext extraction failed", {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
            })
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
                result = await self._llm_extract(text)
                result["extraction_method"] = "llm"
                return result
            except Exception as e:
                error_traceback = traceback.format_exc()
                logger.warning("[ResumeParser] LLM extraction failed, falling back to regex", {
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": error_traceback,
                })
        
        # Fallback to regex-based extraction
        result = self._regex_extract(text)
        result["extraction_method"] = "regex"
        return result
    
    async def _llm_extract(self, text: str) -> Dict[str, Any]:
        """Use Groq LLM to extract structured data from resume text."""
        from groq import AsyncGroq
        
        logger.start_operation("llm_resume_extract")
        start_time = time.time()
        
        client = AsyncGroq(api_key=self.settings.groq_api_key)
        
        prompt = f"""Extract structured data from the following resume text. Return ONLY a valid JSON object with this exact structure:

{{
    "name": "Full name of the person or null if not found",
    "email": "Email address or null if not found",
    "phone": "Phone number or null if not found",
    "experiences": [
        {{
            "company": "Company name",
            "title": "Job title",
            "location": "City, State or Country",
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
            "end_date": "YYYY or null if current",
            "gpa": "GPA if mentioned or null"
        }}
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "projects": [
        {{
            "name": "Project name",
            "description": "Brief description",
            "technologies": ["Tech 1", "Tech 2"]
        }}
    ]
}}

Resume text:
{text[:8000]}

Return ONLY the JSON object, no markdown formatting or explanation."""

        try:
            response = await client.chat.completions.create(
                model=self.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a resume parser. Extract structured data and return valid JSON only. Be thorough and extract all experiences, education, skills, and projects mentioned."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=4000,
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
                "tokens_used": response.usage.total_tokens if response.usage else None,
                "experiences_found": len(result.get("experiences", [])),
                "skills_found": len(result.get("skills", [])),
            })
            
            return result
            
        except json.JSONDecodeError as e:
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] Failed to parse LLM response as JSON", {
                "error": str(e),
                "error_type": type(e).__name__,
                "response_preview": content[:500] if content else None,
                "traceback": error_traceback,
            })
            raise
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error("[ResumeParser] LLM extraction error", {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
            })
            raise
    
    def _regex_extract(self, text: str) -> Dict[str, Any]:
        """Fallback regex-based extraction for basic resume parsing."""
        logger.info("[ResumeParser] Using regex extraction (LLM unavailable or failed)")
        
        result = {
            "name": None,
            "email": None,
            "phone": None,
            "experiences": [],
            "education": [],
            "skills": [],
            "projects": [],
            "warning": "Using basic regex extraction. Results may be incomplete. For better results, ensure GROQ_API_KEY is configured.",
        }
        
        # Extract name (usually first line or first capitalized words)
        lines = text.strip().split('\n')
        if lines:
            first_line = lines[0].strip()
            # Check if first line looks like a name (2-4 capitalized words)
            if re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$', first_line):
                result["name"] = first_line
                logger.debug("[ResumeParser] Name found", {"name": result["name"]})
        
        # Extract email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_match:
            result["email"] = email_match.group()
            logger.debug("[ResumeParser] Email found", {"email": result["email"]})
        
        # Extract phone (various formats)
        phone_patterns = [
            r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
            r'\+?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}',
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                result["phone"] = phone_match.group().strip()
                logger.debug("[ResumeParser] Phone found", {"phone": result["phone"]})
                break
        
        # Extract skills
        skills_patterns = [
            r'(?:skills?|technical skills?|technologies?|proficiencies?)[:\s]*([^\n]+(?:\n(?![A-Z][a-z]+:)[^\n]+)*)',
            r'(?:programming|languages?)[:\s]*([^\n]+)',
        ]
        for pattern in skills_patterns:
            skills_section = re.search(pattern, text, re.IGNORECASE)
            if skills_section:
                skills_text = skills_section.group(1)
                # Split by common delimiters
                skills = re.split(r'[,|•·;\n]', skills_text)
                skills = [s.strip() for s in skills if s.strip() and len(s.strip()) < 50 and len(s.strip()) > 1]
                result["skills"].extend(skills[:30])
                break
        
        # Remove duplicates while preserving order
        result["skills"] = list(dict.fromkeys(result["skills"]))
        
        logger.info("[ResumeParser] Regex extraction complete", {
            "has_name": bool(result["name"]),
            "has_email": bool(result["email"]),
            "has_phone": bool(result["phone"]),
            "skills_count": len(result["skills"]),
        })
        
        return result


# Singleton instance
resume_parser = ResumeParser()
