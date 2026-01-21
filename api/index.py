# /api/main.py
# Vercel Serverless Function entrypoint for FastAPI
# This file exposes the FastAPI app as a single Vercel Python function

import sys
import os

# Add backend directory to Python path so we can import from it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Import the FastAPI app instance from backend
from app.main import app

# Vercel requires the app to be available at module level
# The 'app' variable is automatically detected by Vercel
