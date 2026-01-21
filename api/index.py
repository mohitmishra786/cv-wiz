"""
Vercel Serverless Function entrypoint for FastAPI
Based on: github.com/digitros/nextjs-fastapi
"""

import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Import the FastAPI app instance
from app.main import app
