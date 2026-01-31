#!/bin/bash
# Priority 3: Medium Issues
# These are improvements that enhance functionality but don't block usage

set -e

echo "Creating Priority 3 (Medium) Issues..."

# Issue 12: Add pagination to profile lists
echo "Creating Issue 12: Add pagination to profile list endpoints..."
gh issue create \
  --title "[MEDIUM] Add pagination to profile list endpoints" \
  --body "## Problem\nProfile endpoints return all items at once, which can cause performance issues for users with extensive profiles (100+ experiences/projects).\n\n## Location\n- \`frontend/src/app/api/profile/route.ts\`\n- All list endpoints in \`frontend/src/app/api/profile/\`\n\n## Current Behavior\n- All experiences returned in single request\n- All projects returned in single request\n- No limit on number of items\n- Frontend renders all items at once\n\n## Impact\n- Slow API responses for large profiles\n- Frontend performance degradation\n- High memory usage\n- Poor mobile experience\n\n## Solution\n1. Add pagination parameters (page, limit)\n2. Default limit of 20-50 items\n3. Add cursor-based pagination for better performance\n4. Update frontend to support infinite scroll or pagination\n5. Add search/filter functionality\n\n## Acceptance Criteria\n- [ ] Pagination added to experiences endpoint\n- [ ] Pagination added to projects endpoint\n- [ ] Pagination added to skills endpoint\n- [ ] Pagination added to education endpoint\n- [ ] Frontend implements infinite scroll\n- [ ] Search/filter functionality added\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 13: Implement proper loading states
echo "Creating Issue 13: Implement consistent loading states across UI..."
gh issue create \
  --title "[MEDIUM] Implement consistent loading states across the UI" \
  --body "## Problem\nLoading states are inconsistent across the application, with some actions providing no feedback while others use different loading indicators.\n\n## Location\n- \`frontend/src/app/(protected)/profile/page.tsx\`\n- \`frontend/src/app/(protected)/dashboard/page.tsx\`\n- All form components in \`frontend/src/components/forms/\`\n\n## Current Issues\n- Some buttons don't show loading state\n- No skeleton screens for initial load\n- Inconsistent spinner styles\n- Forms can be submitted multiple times while loading\n\n## Impact\n- Users don't know if actions are in progress\n- Double submissions possible\n- Perceived performance is poor\n- Confusing user experience\n\n## Solution\n1. Create standardized LoadingButton component\n2. Add skeleton screens for all data-fetching pages\n3. Disable form submission while loading\n4. Add loading states to all async actions\n5. Use consistent loading indicators (spinner, progress bar, skeleton)\n\n## Acceptance Criteria\n- [ ] LoadingButton component created\n- [ ] All buttons show loading state during async actions\n- [ ] Skeleton screens for dashboard, profile, templates pages\n- [ ] Forms disabled during submission\n- [ ] Consistent loading indicator styles\n\n## Labels\nenhancement, javascript, good first issue" \
  --label "enhancement" \
  --label "javascript" \
  --label "good first issue"

# Issue 14: Add form validation feedback
echo "Creating Issue 14: Add real-time form validation feedback..."
gh issue create \
  --title "[MEDIUM] Add real-time form validation with visual feedback" \
  --body "## Problem\nForms only validate on submit with basic error messages, providing poor user experience and requiring multiple submission attempts.\n\n## Location\n- \`frontend/src/components/forms/ExperienceForm.tsx\`\n- \`frontend/src/components/forms/ProjectForm.tsx\`\n- \`frontend/src/components/forms/EducationForm.tsx\`\n- \`frontend/src/components/forms/SkillForm.tsx\`\n\n## Current Behavior\n- Validation only on submit\n- Error messages appear below form\n- No visual indication of invalid fields\n- No inline validation\n\n## Impact\n- Poor user experience\n- Multiple submission attempts needed\n- Users don't know what's wrong until they try to submit\n\n## Solution\n1. Add real-time validation on blur/change\n2. Use react-hook-form or formik for validation\n3. Add visual indicators (red borders, checkmarks)\n4. Show inline error messages\n5. Disable submit until form is valid\n6. Add character counters for text fields\n\n## Acceptance Criteria\n- [ ] Real-time validation on all forms\n- [ ] Visual indicators for valid/invalid fields\n- [ ] Inline error messages\n- [ ] Submit button disabled until valid\n- [ ] Character counters for limited fields\n- [ ] Tests for validation logic\n\n## Labels\nenhancement, javascript, good first issue" \
  --label "enhancement" \
  --label "javascript" \
  --label "good first issue"

# Issue 15: Add keyboard navigation
echo "Creating Issue 15: Add keyboard navigation support..."
gh issue create \
  --title "[MEDIUM] Add keyboard navigation support for accessibility" \
  --body "## Problem\nThe application lacks proper keyboard navigation, making it inaccessible to users who cannot use a mouse and violating accessibility standards.\n\n## Location\n- All pages in \`frontend/src/app/\`\n- All components in \`frontend/src/components/\`\n\n## Current Issues\n- No skip links\n- Modal dialogs don't trap focus\n- No keyboard shortcuts\n- Focus indicators not visible\n- Tab order not logical\n\n## Impact\n- Inaccessible to keyboard-only users\n- WCAG compliance violation\n- Poor accessibility score\n- Legal compliance risk\n\n## Solution\n1. Add skip-to-content links\n2. Implement focus trapping in modals\n3. Add keyboard shortcuts (Ctrl+S for save, etc.)\n4. Ensure visible focus indicators\n5. Fix tab order to be logical\n6. Add ARIA labels where needed\n7. Test with keyboard-only navigation\n\n## Acceptance Criteria\n- [ ] Skip-to-content link on all pages\n- [ ] Focus trapping in modals\n- [ ] Keyboard shortcuts documented\n- [ ] Visible focus indicators\n- [ ] Logical tab order\n- [ ] ARIA labels added\n- [ ] Keyboard navigation tested\n\n## Labels\nenhancement, javascript, good first issue" \
  --label "enhancement" \
  --label "javascript" \
  --label "good first issue"

# Issue 16: Add search functionality
echo "Creating Issue 16: Add search functionality to profile items..."
gh issue create \
  --title "[MEDIUM] Add search functionality to profile items" \
  --body "## Problem\nUsers with many experiences, projects, or skills cannot easily find specific items without scrolling through long lists.\n\n## Location\n- \`frontend/src/app/(protected)/profile/page.tsx\`\n- Profile item lists (experiences, projects, skills, education)\n\n## Current Behavior\n- Linear list of all items\n- No search or filter capability\n- Manual scrolling required\n\n## Impact\n- Difficult to find specific items\n- Time-consuming for large profiles\n- Poor user experience\n\n## Solution\n1. Add search bar to profile page\n2. Implement client-side search for immediate results\n3. Add server-side search for large datasets\n4. Add filter by category, date, etc.\n5. Highlight matching terms\n6. Persist search state in URL\n\n## Acceptance Criteria\n- [ ] Search bar added to profile page\n- [ ] Client-side search implemented\n- [ ] Server-side search for large datasets\n- [ ] Filter options (category, date)\n- [ ] Search highlighting\n- [ ] Search state in URL\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

# Issue 17: Add data export functionality
echo "Creating Issue 17: Add data export functionality..."
gh issue create \
  --title "[MEDIUM] Add data export functionality (JSON, PDF, Word)" \
  --body "## Problem\nUsers cannot export their profile data for backup or use outside the application, creating vendor lock-in concerns.\n\n## Location\n- New export feature needed\n- \`frontend/src/app/(protected)/settings/page.tsx\`\n\n## Current Behavior\n- No export functionality\n- Data trapped in application\n- No backup option\n\n## Impact\n- Vendor lock-in concerns\n- No data portability\n- Users hesitant to invest time\n- Compliance issues with data ownership\n\n## Solution\n1. Add export to JSON (complete data)\n2. Add export to PDF (formatted resume)\n3. Add export to DOCX (editable format)\n4. Include all profile data\n5. Add import functionality for JSON\n6. Schedule automatic backups (optional)\n\n## Acceptance Criteria\n- [ ] Export to JSON implemented\n- [ ] Export to PDF implemented\n- [ ] Export to DOCX implemented\n- [ ] Import from JSON implemented\n- [ ] Export includes all data\n- [ ] Settings page has export section\n\n## Labels\nenhancement, javascript, python" \
  --label "enhancement" \
  --label "javascript" \
  --label "python"

# Issue 18: Improve mobile responsiveness
echo "Creating Issue 18: Improve mobile responsiveness..."
gh issue create \
  --title "[MEDIUM] Improve mobile responsiveness across all pages" \
  --body "## Problem\nSeveral pages and components don't work well on mobile devices, with layout issues and touch targets that are too small.\n\n## Location\n- \`frontend/src/app/(protected)/profile/page.tsx\`\n- \`frontend/src/app/(protected)/dashboard/page.tsx\`\n- All form components\n\n## Current Issues\n- Tables don't scroll horizontally\n- Forms overflow screen width\n- Touch targets too small\n- Modals don't fit screen\n- Navigation difficult on mobile\n\n## Impact\n- Poor mobile experience\n- Users can't manage profiles on mobile\n- Reduced user engagement\n\n## Solution\n1. Audit all pages on mobile devices\n2. Make tables horizontally scrollable\n3. Stack form fields on mobile\n4. Increase touch target sizes (min 44px)\n5. Optimize modals for mobile\n6. Add mobile-specific navigation\n7. Test on various screen sizes\n\n## Acceptance Criteria\n- [ ] All pages usable on mobile\n- [ ] Tables scroll horizontally\n- [ ] Forms stack properly\n- [ ] Touch targets >= 44px\n- [ ] Modals fit mobile screen\n- [ ] Mobile navigation works\n- [ ] Tested on iOS and Android\n\n## Labels\nenhancement, javascript" \
  --label "enhancement" \
  --label "javascript"

echo "Priority 3 (Medium) issues created successfully!"
