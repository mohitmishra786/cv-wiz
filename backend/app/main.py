"""
FastAPI Main Application Entry Point
CV-Wiz Resume Compiler API
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import compile, cover_letter
from app.utils.redis_cache import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    settings = get_settings()
    print(f"Starting CV-Wiz API...")
    print(f"Groq Model: {settings.groq_model}")
    
    yield
    
    # Shutdown
    await redis_client.close()
    print("CV-Wiz API shutdown complete")


app = FastAPI(
    title="CV-Wiz API",
    description="Career Resume Compiler - Generate tailored resumes and cover letters",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        settings.nextauth_url,
        "chrome-extension://*",  # Allow Chrome extension
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(compile.router, prefix="/api", tags=["Resume"])
app.include_router(cover_letter.router, prefix="/api", tags=["Cover Letter"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "cv-wiz-api", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB check
        "redis": "connected",      # TODO: Add actual Redis check
    }
