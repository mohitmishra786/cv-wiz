#!/bin/bash
# Priority 4: Low/Enhancement Issues
# These are nice-to-have features and minor improvements

set -e

echo "Creating Priority 4 (Low/Enhancement) Issues..."

# Issue 19: Add dark mode toggle
echo "Creating Issue 19: Add dark mode toggle..."
gh issue create \
  --title "[LOW] Add dark mode toggle with persistent preference" \
  --body "## Problem\nThe application only supports light mode. Users have requested dark mode for better visibility in low-light environments and reduced eye strain.\n\n## Location\n- \`frontend/src/components/ThemeProvider.tsx\`\n- \`frontend/src/app/globals.css\`\n\n## Current Behavior\n- Only light mode available\n- No theme switching\n- No preference persistence\n\n## Impact\n- User preference not supported\n- Eye strain in low light\n- Modern app expectation\n\n## Solution\n1. Extend ThemeProvider to support dark mode\n2. Add CSS variables for dark theme\n3. Add toggle button in header/settings\n4. Persist preference in localStorage\n5. Respect system preference as default\n6. Add smooth transitions between themes\n\n## Acceptance Criteria\n- [ ] Dark mode CSS variables defined\n- [ ] Theme toggle button added\n- [ ] Preference persisted in localStorage\n- [ ] System preference respected\n- [ ] Smooth transitions implemented\n- [ ] All components support dark mode\n\n## Labels\nenhancement, javascript, good first issue" \
  --label "enhancement" \
  --label "javascript" \
  --label "good first issue"

# Issue 20: Add keyboard shortcuts help
echo "Creating Issue 20: Add keyboard shortcuts help modal..."
gh issue create \
  --title "[LOW] Add keyboard shortcuts help modal" \
  --body "## Problem\nUsers are unaware of available keyboard shortcuts that could improve their productivity.\n\n## Location\n- New component needed\n- Add to header or settings\n\n## Current Behavior\n- No documentation of shortcuts\n- Users must discover shortcuts accidentally\n\n## Impact\n- Reduced productivity\n- Hidden features not used\n\n## Solution\n1. Create keyboard shortcuts help modal\n2. Add ? key shortcut to open help\n3. Document all available shortcuts\n4. Show shortcut hints in tooltips\n5. Add link in footer/header\n\n## Acceptance Criteria\n- [ ] Help modal created\n- [ ] ? key opens help\n- [ ] All shortcuts documented\n- [ ] Tooltip hints added\n- [ ] Accessible from UI\n\n## Labels\nenhancement, javascript, good first issue" \
  --label "enhancement" \
  --label "javascript" \
  --label "good first issue"

# Issue 21: Add onboarding tour improvements
echo "Creating Issue 21: Add interactive onboarding tour..."
gh issue create \
  --title "[LOW] Enhance onboarding tour with interactive steps" \
  --body "## Problem\nThe current onboarding is minimal and doesn't guide users through key features effectively.\n\n## Location\n- \`frontend/src/components/OnboardingTour.tsx\`\n\n## Current Behavior\n- Basic tour exists\n- Doesn't highlight all features\n- No progress tracking\n\n## Impact\n- Users don't discover all features\n- Higher abandonment rate\n- Support requests\n\n## Solution\n1. Add step-by-step interactive tour\n2. Highlight key features (profile, templates, extension)\n3. Add progress indicator\n4. Allow users to skip or resume\n5. Show tour on first login only\n6. Add \"Restart Tour\" option in settings\n\n## Acceptance Criteria\n- [ ] Interactive step-by-step tour\n- [ ] All key features highlighted\n- [ ] Progress indicator\n- [ ] Skip/resume functionality\n- [ ] First-login only trigger\n- [ ] Restart option in settings\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 22: Add analytics dashboard improvements
echo "Creating Issue 22: Add more analytics to dashboard..."
gh issue create \
  --title "[LOW] Enhance analytics dashboard with more insights" \
  --body "## Problem\nThe current dashboard shows basic stats but lacks insights that could help users improve their job search.\n\n## Location\n- \`frontend/src/app/(protected)/dashboard/page.tsx\`\n- \`frontend/src/app/api/profile/analytics/route.ts\`\n\n## Current Stats\n- Profile completeness\n- Item counts\n- Weekly applications\n\n## Desired Insights\n- Most used skills\n- Resume versions generated\n- Cover letters by company\n- Application success rate (if tracked)\n- Profile views (if public profiles)\n- Skill gap analysis\n\n## Solution\n1. Track more metrics in database\n2. Add new chart components\n3. Show trends over time\n4. Add skill gap recommendations\n5. Export analytics report\n\n## Acceptance Criteria\n- [ ] New metrics tracked\n- [ ] Charts for trends\n- [ ] Skill gap analysis\n- [ ] Export functionality\n- [ ] Responsive charts\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 23: Add template preview with sample data
echo "Creating Issue 23: Add template preview with sample data..."
gh issue create \
  --title "[LOW] Add template preview with realistic sample data" \
  --body "## Problem\nTemplate previews currently show generic mock data, not giving users a realistic view of how their resume will look.\n\n## Location\n- \`frontend/src/components/templates/TemplatePreview.tsx\`\n- \`frontend/src/app/(protected)/templates/page.tsx\`\n\n## Current Behavior\n- Generic placeholder preview\n- No realistic content\n- Users can't visualize their data\n\n## Impact\n- Users can't make informed template choice\n- May need to regenerate multiple times\n\n## Solution\n1. Generate preview with user's actual data\n2. Show mini PDF preview\n3. Allow switching between templates in preview\n4. Highlight differences between templates\n5. Add \"Use This Template\" button\n\n## Acceptance Criteria\n- [ ] Preview uses user's data\n- [ ] Mini PDF preview generated\n- [ ] Template switcher in preview\n- [ ] Highlight differences\n- [ ] Direct select button\n\n## Labels\nenhancement, javascript, python" \
  --label "enhancement" \
  --label "javascript" \
  --label "python"

# Issue 24: Add LinkedIn import
echo "Creating Issue 24: Add LinkedIn profile import..."
gh issue create \
  --title "[LOW] Add LinkedIn profile import functionality" \
  --body "## Problem\nUsers must manually enter all profile data. LinkedIn import would significantly speed up onboarding.\n\n## Location\n- New API route: \`frontend/src/app/api/integrations/linkedin/\`\n- UI component for import\n\n## Current Behavior\n- Manual data entry only\n- No import options except GitHub\n\n## Impact\n- Long onboarding time\n- User drop-off\n- Data entry errors\n\n## Solution\n1. Research LinkedIn API options\n2. Implement OAuth flow\n3. Map LinkedIn data to profile schema\n4. Allow selective import\n5. Handle API limitations\n\n## Note\nLinkedIn API has strict limitations. May need to use alternative approaches like resume upload parsing.\n\n## Acceptance Criteria\n- [ ] LinkedIn OAuth implemented\n- [ ] Data mapping defined\n- [ ] Selective import UI\n- [ ] Error handling\n- [ ] Documentation\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 25: Add resume version history
echo "Creating Issue 25: Add resume version history..."
gh issue create \
  --title "[LOW] Add resume version history and rollback" \
  --body "## Problem\nUsers cannot see or restore previous versions of their profile data, making it risky to make major changes.\n\n## Location\n- Database schema changes\n- New UI components\n\n## Current Behavior\n- Updates overwrite data\n- No history kept\n- Cannot undo changes\n\n## Impact\n- Risk of data loss\n- No experimentation\n- User anxiety about changes\n\n## Solution\n1. Add versioning to profile tables\n2. Store version history\n3. Add version comparison UI\n4. Add rollback functionality\n5. Limit history size (e.g., last 50 versions)\n\n## Acceptance Criteria\n- [ ] Version tracking implemented\n- [ ] History stored in database\n- [ ] Version comparison UI\n- [ ] Rollback functionality\n- [ ] History size limits\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 26: Add collaborative features
echo "Creating Issue 26: Add resume review/sharing features..."
gh issue create \
  --title "[LOW] Add resume sharing and review features" \
  --body "## Problem\nUsers cannot easily share their resumes for feedback or collaborate with mentors/career coaches.\n\n## Location\n- New sharing feature\n- Public profile pages\n\n## Current Behavior\n- No sharing functionality\n- No collaboration\n- Limited to PDF export\n\n## Impact\n- Users can't get feedback\n- No collaboration with coaches\n- Missed improvement opportunities\n\n## Solution\n1. Add shareable links to resumes\n2. Create public profile view\n3. Add commenting system\n4. Allow reviewers without accounts\n5. Add privacy controls\n\n## Acceptance Criteria\n- [ ] Shareable links generated\n- [ ] Public profile view\n- [ ] Commenting system\n- [ ] Guest reviewer access\n- [ ] Privacy controls\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 27: Add job application tracker
echo "Creating Issue 27: Add job application tracker..."
gh issue create \
  --title "[LOW] Add job application tracking system" \
  --body "## Problem\nUsers track job applications separately. Integrating this would provide a complete job search management solution.\n\n## Location\n- New feature module\n- Database schema additions\n\n## Current Behavior\n- No application tracking\n- Users use external tools\n\n## Impact\n- Fragmented workflow\n- Missed follow-ups\n- No application insights\n\n## Solution\n1. Add application tracking table\n2. Create application entry UI\n3. Add status pipeline (Applied, Interview, Offer, Rejected)\n4. Add reminders for follow-ups\n5. Link applications to generated resumes/cover letters\n6. Add application analytics\n\n## Acceptance Criteria\n- [ ] Application tracking schema\n- [ ] CRUD UI for applications\n- [ ] Status pipeline\n- [ ] Follow-up reminders\n- [ ] Link to resume/cover letter\n- [ ] Application analytics\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 28: Add AI-powered skill suggestions
echo "Creating Issue 28: Add AI-powered skill suggestions..."
gh issue create \
  --title "[LOW] Add AI-powered skill suggestions based on experience" \
  --body "## Problem\nUsers may forget to add relevant skills. AI could analyze their experience and suggest missing skills.\n\n## Location\n- \`backend/app/services/\` - new service\n- \`frontend/src/components/forms/SkillForm.tsx\`\n\n## Current Behavior\n- Manual skill entry only\n- No suggestions\n\n## Impact\n- Incomplete profiles\n- Missed keyword matches\n- Lower relevance scores\n\n## Solution\n1. Analyze experience descriptions with LLM\n2. Extract implied skills\n3. Compare with existing skills\n4. Suggest missing skills\n5. Allow one-click add\n\n## Acceptance Criteria\n- [ ] Skill extraction service\n- [ ] Suggestion UI in skill form\n- [ ] One-click add\n- [ ] Configurable suggestion count\n\n## Labels\nenhancement, javascript, python" \
  --label "enhancement" \
  --label "javascript" \
  --label "python"

echo "Priority 4 (Low/Enhancement) issues created successfully!"
