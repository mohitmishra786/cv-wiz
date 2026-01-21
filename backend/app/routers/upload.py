"""
Resume Upload Router
API endpoint for uploading and parsing resume files.
"""

import time
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.services.resume_parser import resume_parser
from app.utils.logger import logger, get_request_id


router = APIRouter()


# Allowed file types and max size
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload/resume")
async def upload_resume(file: UploadFile = File(...)) -> JSONResponse:
    """
    Upload and parse a resume file.
    
    Accepts PDF and DOCX files up to 5MB.
    Returns structured resume data including experiences, education, and skills.
    """
    request_id = get_request_id()
    start_time = time.time()
    
    logger.start_operation("upload_resume", {
        "request_id": request_id,
        "filename": file.filename,
        "content_type": file.content_type,
    })
    
    try:
        # Validate file type
        if file.content_type not in ALLOWED_TYPES:
            logger.warning("[Upload] Invalid file type", {
                "request_id": request_id,
                "content_type": file.content_type,
                "allowed": list(ALLOWED_TYPES.keys()),
            })
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: PDF, DOCX",
            )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        logger.info("[Upload] File received", {
            "request_id": request_id,
            "filename": file.filename,
            "size_bytes": file_size,
        })
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            logger.warning("[Upload] File too large", {
                "request_id": request_id,
                "size_bytes": file_size,
                "max_bytes": MAX_FILE_SIZE,
            })
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB",
            )
        
        if file_size == 0:
            logger.warning("[Upload] Empty file", {"request_id": request_id})
            raise HTTPException(
                status_code=400,
                detail="File is empty",
            )
        
        # Parse the resume
        logger.info("[Upload] Starting resume parsing", {
            "request_id": request_id,
            "filename": file.filename,
        })
        
        result = await resume_parser.parse_file(content, file.filename)
        
        duration_ms = (time.time() - start_time) * 1000
        
        if "error" in result:
            logger.warning("[Upload] Parsing returned error", {
                "request_id": request_id,
                "error": result["error"],
                "duration_ms": round(duration_ms, 2),
            })
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "error": result["error"],
                    "request_id": request_id,
                },
            )
        
        logger.end_operation("upload_resume", duration_ms, {
            "request_id": request_id,
            "filename": file.filename,
            "experiences_count": len(result.get("experiences", [])),
            "skills_count": len(result.get("skills", [])),
            "education_count": len(result.get("education", [])),
        })
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": result,
                "request_id": request_id,
            },
        )
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.fail_operation("upload_resume", e, {
            "request_id": request_id,
            "duration_ms": round(duration_ms, 2),
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process resume: {str(e)}",
        )
