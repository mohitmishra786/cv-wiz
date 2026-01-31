"""
FastAPI Main Application Entry Point
CV-Wiz Resume Compiler API
"""

import time
import psutil
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

# Initialize Sentry
settings = get_settings()
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=settings.environment,
    )

from app.routers import compile, cover_letter, upload, ai  # noqa: E402
from app.utils.redis_cache import redis_client  # noqa: E402
from app.utils.rate_limiter import apply_rate_limiting  # noqa: E402
from app.utils.logger import (  # noqa: E402
    logger, 
    generate_request_id, 
    set_request_context, 
    clear_request_context,
    log_api_request
)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests with timing and correlation IDs"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate or extract request ID
        request_id = request.headers.get("x-request-id") or generate_request_id()
        
        # Set request context for logging
        set_request_context(request_id=request_id)
        
        # Log request start
        logger.info(f"[REQUEST] {request.method} {request.url.path}", {
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params) if request.query_params else None,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", "")[:100],
        })
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            
            # Add request ID to response headers
            response.headers["x-request-id"] = request_id
            
            # Log response
            log_api_request(
                request.method, 
                request.url.path, 
                response.status_code, 
                duration_ms
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"[REQUEST ERROR] {request.method} {request.url.path}", {
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round(duration_ms, 2),
                "error_type": type(e).__name__,
                "error_message": str(e),
            }, exc_info=True)
            raise
        finally:
            clear_request_context()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    settings = get_settings()
    logger.info("[STARTUP] CV-Wiz API starting", {
        "groq_model": settings.groq_model,
        "frontend_url": settings.effective_frontend_url,
        "database_url": "configured" if settings.database_url else "NOT SET",
        "redis_url": "configured" if settings.redis_url else "NOT SET",
        "upstash_rest_url": "configured" if settings.upstash_redis_rest_url else "not set",
    })
    
    yield
    
    # Shutdown
    await redis_client.close()
    logger.info("[SHUTDOWN] CV-Wiz API shutdown complete")



app = FastAPI(
    title="CV-Wiz API",
    description="Career Resume Compiler - Generate tailored resumes and cover letters",
    version="1.0.0",
    lifespan=lifespan,
    root_path="/api/py",  # For Vercel deployment with Next.js rewrites
)

# Initialize rate limiting
apply_rate_limiting(app)

# Add logging middleware FIRST
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityMiddleware)

# Configure CORS
# In monorepo Vercel deployment, frontend and backend are on the same domain
# so we allow all origins. The vercel.json also sets CORS headers.
settings = get_settings()

# Build allowed origins list for standalone deployments
# For monorepo, we use ["*"] since requests come from same origin
_cors_origins = [
    "*",  # Allow all origins (safe in monorepo - same domain)
    settings.effective_frontend_url,  # Production frontend URL
    settings.nextauth_url,  # Auth callback URL
    "https://cv-wiz-psi.vercel.app",  # Explicit production frontend
]
# Filter out empty strings and deduplicate
allowed_origins = list(set(origin for origin in _cors_origins if origin))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (no prefix - frontend adds /api/py via getBackendUrl)
app.include_router(compile.router, tags=["Resume"])
app.include_router(cover_letter.router, tags=["Cover Letter"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(ai.router, tags=["AI"])


@app.get("/")
async def root():
    """Health check endpoint."""
    logger.debug("[HEALTH] Root endpoint called")
    return {"status": "healthy", "service": "cv-wiz-api", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Detailed health check with logging."""
    logger.info("[HEALTH] Health check requested")
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "database": "unknown",
        "redis": "unknown",
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent
        },
        "config": {
            "groq_api_key": "configured" if settings.groq_api_key else "NOT SET",
            "database_url": "configured" if settings.database_url else "NOT SET",
            "redis_url": "configured" if settings.redis_url else "NOT SET",
        }
    }
    
    # Check Redis connection
    try:
        if redis_client:
            await redis_client.ping()
            health_status["redis"] = "connected"
            logger.debug("[HEALTH] Redis connection OK")
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        logger.warning("[HEALTH] Redis connection failed", {"error": str(e)})
    
    logger.info("[HEALTH] Health check complete", health_status)
    return health_status
