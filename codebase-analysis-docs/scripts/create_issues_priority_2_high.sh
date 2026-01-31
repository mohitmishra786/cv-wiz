#!/bin/bash
# Priority 2: High Issues
# These are important features or bugs that impact user experience or security

set -e

echo "Creating Priority 2 (High) Issues..."

# Issue 6: Missing comprehensive test coverage
echo "Creating Issue 6: Missing comprehensive test coverage..."
gh issue create \
  --title "[HIGH] Missing comprehensive test coverage for critical paths" \
  --body "## Problem\nThe codebase lacks comprehensive test coverage, especially for critical business logic like resume compilation, cover letter generation, and relevance scoring.\n\n## Current State\n- Only basic health check tests exist\n- No tests for RelevanceScorer algorithm\n- No tests for PDF generation\n- No tests for Groq client integration\n- No integration tests for end-to-end flows\n\n## Location\n- \`backend/tests/\` - only has basic tests\n- Missing tests for:\n  - \`backend/app/services/resume_compiler.py\`\n  - \`backend/app/services/cover_letter_generator.py\`\n  - \`backend/app/utils/relevance_scorer.py\`\n  - \`backend/app/utils/pdf_generator.py\`\n  - \`backend/app/services/groq_client.py\`\n\n## Impact\n- Risk of regressions when making changes\n- Difficult to refactor safely\n- No confidence in deployments\n- Bugs may go unnoticed\n\n## Solution\n1. Add unit tests for all service classes\n2. Add integration tests for API endpoints\n3. Add tests for RelevanceScorer with known inputs/outputs\n4. Mock external dependencies (Groq API, Redis)\n5. Set up test coverage reporting (pytest-cov)\n6. Aim for >80% coverage on critical paths\n\n## Acceptance Criteria\n- [ ] Unit tests for ResumeCompiler\n- [ ] Unit tests for CoverLetterGenerator\n- [ ] Unit tests for RelevanceScorer\n- [ ] Unit tests for PDFGenerator\n- [ ] Integration tests for compile endpoint\n- [ ] Integration tests for cover-letter endpoint\n- [ ] Mock external APIs in tests\n- [ ] CI pipeline runs tests on PR\n- [ ] Coverage report generated\n\n## Labels\nenhancement, python, good first issue" \
  --label "enhancement" \
  --label "python" \
  --label "good first issue"

# Issue 7: No input sanitization on user-generated content
echo "Creating Issue 7: No input sanitization on user-generated content..."
gh issue create \
  --title "[HIGH] Missing input sanitization on user-generated content" \
  --body "## Problem\nUser-generated content (experience descriptions, project names, etc.) is not sanitized before storage or rendering, creating potential XSS vulnerabilities.\n\n## Location\n- All form submissions in \`frontend/src/components/forms/\`\n- API routes in \`frontend/src/app/api/profile/\`\n- PDF generation in \`backend/app/utils/pdf_generator.py\`\n\n## Current Behavior\n- HTML/JS in descriptions stored as-is\n- Content rendered without escaping in some contexts\n- PDF generation uses Jinja2 without autoescape\n\n## Impact\n- Potential XSS attacks\n- PDF generation could be broken by special characters\n- Database could contain malicious content\n\n## Solution\n1. Add input sanitization middleware\n2. Use DOMPurify on frontend before sending\n3. Enable Jinja2 autoescape in PDF templates\n4. Validate and escape all user inputs\n5. Add Content Security Policy headers\n\n## Acceptance Criteria\n- [ ] Input sanitization middleware implemented\n- [ ] DOMPurify added to frontend forms\n- [ ] Jinja2 autoescape enabled\n- [ ] XSS tests added\n- [ ] Security audit performed\n\n## Labels\nbug, python, javascript" \
  --label "bug" \
  --label "python" \
  --label "javascript"

# Issue 8: Missing error boundaries in frontend
echo "Creating Issue 8: Missing error boundaries in React components..."
gh issue create \
  --title "[HIGH] Missing React error boundaries - crashes take down entire app" \
  --body "## Problem\nThe frontend lacks error boundaries, meaning any unhandled error in a component can crash the entire application.\n\n## Location\n- \`frontend/src/app/layout.tsx\`\n- All page components in \`frontend/src/app/(protected)/\`\n\n## Current Behavior\n- No error boundaries implemented\n- Single component error crashes entire app\n- Users see blank screen or generic Next.js error\n\n## Impact\n- Poor user experience\n- Difficult to debug production issues\n- No graceful degradation\n- Potential data loss on form errors\n\n## Solution\n1. Add error boundaries to root layout\n2. Add error boundaries to each major section\n3. Create user-friendly error UI\n4. Add error logging to Sentry\n5. Implement retry mechanisms where appropriate\n\n## Acceptance Criteria\n- [ ] Root error boundary implemented\n- [ ] Section-specific error boundaries added\n- [ ] User-friendly error UI created\n- [ ] Errors logged to Sentry\n- [ ] Retry functionality where applicable\n\n## Labels\nbug, javascript, enhancement" \
  --label "bug" \
  --label "javascript" \
  --label "enhancement"

# Issue 9: No database transaction handling
echo "Creating Issue 9: Missing database transaction handling..."
gh issue create \
  --title "[HIGH] Missing database transaction handling for multi-table operations" \
  --body "## Problem\nMulti-table operations (like profile updates) lack transaction handling, potentially leaving database in inconsistent state on partial failures.\n\n## Location\n- \`frontend/src/app/api/profile/route.ts\`\n- All API routes that modify multiple tables\n\n## Current Behavior\n- Each query runs independently\n- Partial failures leave data inconsistent\n- No rollback mechanism\n\n## Example Scenario\n1. User updates profile with new experience and skills\n2. Experience insert succeeds\n3. Skills insert fails\n4. Database now has inconsistent state\n\n## Impact\n- Data inconsistency\n- Difficult to recover from errors\n- Potential data loss\n- User confusion\n\n## Solution\n1. Use Prisma transactions for multi-table operations\n2. Wrap related operations in \`$transaction\`\n3. Add proper error handling with rollback\n4. Add tests for transaction behavior\n\n## Acceptance Criteria\n- [ ] Transactions used for multi-table operations\n- [ ] Rollback on partial failure\n- [ ] Tests for transaction behavior\n- [ ] Documentation updated\n\n## Labels\nbug, javascript" \
  --label "bug" \
  --label "javascript"

# Issue 10: Extension job extraction reliability
echo "Creating Issue 10: Extension job extraction selectors need maintenance..."
gh issue create \
  --title "[HIGH] Chrome Extension job extraction selectors need regular maintenance" \
  --body "## Problem\nJob board selectors in the Chrome Extension are brittle and will break when sites update their HTML structure. Currently there's no monitoring or fallback strategy.\n\n## Location\n- \`extension/content/job-extractor.js\` lines 10-100\n\n## Current Selectors\n- LinkedIn: 4 description selectors, 3 title selectors\n- Indeed: 3 description selectors, 2 title selectors\n- Glassdoor: 3 description selectors, 2 title selectors\n- Greenhouse: 3 description selectors, 2 title selectors\n- Lever: 3 description selectors, 2 title selectors\n\n## Impact\n- Extension stops working when job boards update\n- Users cannot extract job descriptions\n- No notification when extraction fails\n- Difficult to debug selector issues\n\n## Solution\n1. Add telemetry to track extraction success rates\n2. Implement ML-based fallback extraction\n3. Add user feedback when extraction fails\n4. Create automated tests for selectors\n5. Set up monitoring alerts for extraction failures\n6. Document selector update process\n\n## Acceptance Criteria\n- [ ] Telemetry added for extraction success/failure\n- [ ] User sees clear message when extraction fails\n- [ ] Manual extraction option provided\n- [ ] Tests for each job board selector\n- [ ] Documentation for updating selectors\n\n## Labels\nbug, javascript, enhancement" \
  --label "bug" \
  --label "javascript" \
  --label "enhancement"

# Issue 11: Missing audit logging
echo "Creating Issue 11: Missing audit logging for compliance..."
gh issue create \
  --title "[HIGH] Missing audit logging for data modifications" \
  --body "## Problem\nThere's no audit trail for data modifications (create, update, delete), making it impossible to track changes for compliance or debugging.\n\n## Location\n- All API routes in \`frontend/src/app/api/profile/\`\n- All modify operations in backend\n\n## Current Behavior\n- No record of who changed what and when\n- Cannot investigate data issues\n- No compliance trail\n\n## Impact\n- Compliance violations (GDPR, etc.)\n- Cannot debug data issues\n- No accountability for changes\n- Security incidents cannot be investigated\n\n## Solution\n1. Add audit log table to database\n2. Log all CRUD operations\n3. Include: user ID, action, entity type, entity ID, timestamp, before/after values\n4. Add middleware for automatic audit logging\n5. Create audit log viewer for admins\n\n## Acceptance Criteria\n- [ ] Audit log table created\n- [ ] All CRUD operations logged\n- [ ] Middleware for automatic logging\n- [ ] Audit logs retained for compliance period\n- [ ] Admin interface to view logs\n\n## Labels\nenhancement, python, javascript" \
  --label "enhancement" \
  --label "python" \
  --label "javascript"

echo "Priority 2 (High) issues created successfully!"
