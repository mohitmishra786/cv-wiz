"""
Vercel Serverless Function entrypoint for FastAPI
Handles Next.js rewrites by extracting path from query parameters
"""

import sys
import os
from urllib.parse import parse_qs

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Import the FastAPI app instance
from app.main import app


class VercelPathFixerMiddleware:
    """
    ASGI middleware to fix path routing for Vercel rewrites.
    
    Vercel/Next.js rewrites send path as query param:
      x-nextjs-rewritten-query: path=upload/resume
    
    This middleware extracts it and overwrites scope['path'] so 
    FastAPI can route correctly.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Extract query string
            query_string = scope.get("query_string", b"").decode("utf-8")
            
            if query_string:
                # Parse query parameters
                query_params = parse_qs(query_string)
                
                # Check if 'path' parameter exists (from Next.js rewrite)
                if "path" in query_params:
                    # Get the path value
                    path_value = query_params["path"][0]
                    
                    # Ensure it starts with /
                    if not path_value.startswith("/"):
                        path_value = f"/{path_value}"
                    
                    # Override the ASGI path
                    scope["path"] = path_value
                    
                    # Clean up query string (remove path param)
                    remaining_params = {
                        k: v for k, v in query_params.items() if k != "path"
                    }
                    if remaining_params:
                        # Rebuild query string without path param
                        new_qs = "&".join(
                            f"{k}={v[0]}" for k, v in remaining_params.items()
                        )
                        scope["query_string"] = new_qs.encode("utf-8")
                    else:
                        scope["query_string"] = b""
        
        # Call the FastAPI app with the modified scope
        await self.app(scope, receive, send)


# Wrap the FastAPI app with the path fixer middleware
app = VercelPathFixerMiddleware(app)
