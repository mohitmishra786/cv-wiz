#!/bin/bash
# Priority 1: Critical Issues
# These are bugs or missing features that break core functionality

set -e

echo "Creating Priority 1 (Critical) Issues..."

# Issue 1: Extension API URL hardcoded to localhost
echo "Creating Issue 1: Extension uses hardcoded localhost API URL..."
gh issue create \
  --title "[CRITICAL] Chrome Extension uses hardcoded localhost API URL" \
  --body "## Problem\nThe Chrome Extension has hardcoded API URLs pointing to localhost, making it non-functional in production.\n\n## Location\n- \`extension/background/service-worker.js\` line 8\n- \`extension/popup/popup.js\` line 8\n\n## Current Code\n\`\`\`javascript\nconst CONFIG = {\n    API_BASE_URL: 'http://localhost:8000/api',\n    FRONTEND_URL: 'http://localhost:3000',\n};\n\`\`\`\n\n## Impact\n- Extension completely fails in production\n- Users cannot compile resumes or generate cover letters\n- All API calls fail with connection errors\n\n## Solution\n1. Read API URL from extension storage (set during build or via options page)\n2. Use environment variables during build process\n3. Add options page for users to configure API URL\n4. Default to production URL if not configured\n\n## Acceptance Criteria\n- [ ] Extension works in production environment\n- [ ] API URL is configurable\n- [ ] Falls back to production URL when not configured\n- [ ] Documentation updated with configuration instructions\n\n## Labels\nbug, javascript" \
  --label "bug" \
  --label "javascript"

# Issue 2: Missing input validation on job description length
echo "Creating Issue 2: Missing backend validation on job description length..."
gh issue create \
  --title "[CRITICAL] Missing validation on job description length in backend" \
  --body "## Problem\nWhile the Pydantic models define min/max length for job descriptions, there's no explicit validation in the router handlers, potentially allowing oversized payloads that could cause memory issues or LLM API errors.\n\n## Location\n- \`backend/app/routers/compile.py\`\n- \`backend/app/routers/cover_letter.py\`\n\n## Current Behavior\n- Pydantic validates min_length=50, max_length=50000\n- No additional validation before processing\n- Large JDs can cause Groq API errors or timeouts\n\n## Impact\n- Potential DoS via oversized job descriptions\n- Groq API failures with very large inputs\n- Poor user experience with no clear error message\n\n## Solution\n1. Add explicit length validation in router handlers\n2. Truncate or reject oversized job descriptions\n3. Add clear error messages for validation failures\n4. Consider token count estimation for LLM limits\n\n## Acceptance Criteria\n- [ ] Input validation added to compile endpoint\n- [ ] Input validation added to cover-letter endpoint\n- [ ] Clear error messages returned to users\n- [ ] Tests added for boundary conditions\n\n## Labels\nbug, python" \
  --label "bug" \
  --label "python"

# Issue 3: Redis cache fails silently
echo "Creating Issue 3: Redis cache failures are silent..."
gh issue create \
  --title "[CRITICAL] Redis cache failures are silent - no fallback mechanism" \
  --body "## Problem\nRedis cache operations fail silently with only console print statements, making it difficult to detect and diagnose caching issues in production.\n\n## Location\n- \`backend/app/utils/redis_cache.py\` lines 65-68, 94-97\n\n## Current Code\n\`\`\`python\nexcept Exception as e:\n    # Log error but don't fail - cache is optional\n    print(f\"Redis get error: {e}\")\n\`\`\`\n\n## Impact\n- Cache failures go unnoticed in production\n- No metrics on cache hit/miss rates\n- Difficult to diagnose Redis connection issues\n- Users experience slower responses without knowing why\n\n## Solution\n1. Replace print statements with proper logging\n2. Add metrics/monitoring for cache operations\n3. Add health check for Redis connection\n4. Consider circuit breaker pattern for repeated failures\n\n## Acceptance Criteria\n- [ ] Redis errors use structured logging\n- [ ] Cache metrics exposed (hits, misses, errors)\n- [ ] Health endpoint checks Redis connectivity\n- [ ] Alerts configured for cache failures\n\n## Labels\nbug, python" \
  --label "bug" \
  --label "python"

# Issue 4: PDF generation not available check
echo "Creating Issue 4: PDF generation silently skipped when WeasyPrint unavailable..."
gh issue create \
  --title "[CRITICAL] PDF generation silently skipped when WeasyPrint is unavailable" \
  --body "## Problem\nWhen WeasyPrint dependencies are missing, PDF generation is silently skipped, returning only JSON data without clear indication to the user.\n\n## Location\n- \`backend/app/services/resume_compiler.py\` lines 165-182\n\n## Current Code\n\`\`\`python\nif self.pdf_generator:\n    # Generate PDF\nelse:\n    logger.warning(\"PDF generator not available\", {...})\n\`\`\`\n\n## Impact\n- Users don't receive PDF files\n- No clear error message explaining why\n- Extension shows broken/missing PDF\n- Difficult to diagnose deployment issues\n\n## Solution\n1. Return explicit error when PDF generation fails\n2. Add PDF generation to health check endpoint\n3. Document system dependencies required\n4. Consider fallback PDF generation method\n\n## Acceptance Criteria\n- [ ] Clear error returned when PDF generation unavailable\n- [ ] Health check verifies PDF generation capability\n- [ ] Documentation lists all system dependencies\n- [ ] User-friendly error message in extension\n\n## Labels\nbug, python" \
  --label "bug" \
  --label "python"

# Issue 5: Missing rate limiting on API endpoints
echo "Creating Issue 5: No rate limiting on API endpoints..."
gh issue create \
  --title "[CRITICAL] No rate limiting on API endpoints - vulnerable to abuse" \
  --body "## Problem\nAPI endpoints lack rate limiting, making them vulnerable to abuse, brute force attacks, and excessive LLM API costs.\n\n## Location\n- All endpoints in \`backend/app/routers/\`\n\n## Current Behavior\n- No rate limiting middleware\n- No IP-based throttling\n- No user-based quotas\n- Groq API calls can be triggered unlimited times\n\n## Impact\n- Potential for abuse and DoS attacks\n- Excessive LLM API costs\n- Redis cache can be flooded\n- No protection against brute force on auth\n\n## Solution\n1. Add rate limiting middleware (slowapi or custom)\n2. Implement tiered limits:\n   - Anonymous: very limited\n   - Authenticated: reasonable limits\n   - Premium: higher limits\n3. Add Redis-backed rate limit storage\n4. Return proper 429 status codes\n\n## Acceptance Criteria\n- [ ] Rate limiting middleware implemented\n- [ ] Limits configured per endpoint type\n- [ ] Redis used for distributed rate limiting\n- [ ] Proper 429 responses with Retry-After headers\n- [ ] Tests for rate limiting behavior\n\n## Labels\nbug, python, enhancement" \
  --label "bug" \
  --label "python" \
  --label "enhancement"

echo "Priority 1 (Critical) issues created successfully!"
