# Job Board Selectors Maintenance Guide

This document describes how to maintain and update the job extraction selectors used in the CV-Wiz Chrome Extension.

## Location
Selectors are defined in `extension/content/job-extractor.js` in the `JOB_SELECTORS` constant.

## Structure
```javascript
const JOB_SELECTORS = {
    linkedin: {
        description: ['.selector-1', '.selector-2'], // Priority order
        title: ['.title-selector'],
        company: ['.company-selector']
    },
    // ...
};
```

## How to Update
1. **Identify Breakage**: If extraction fails for a specific site, `extraction_failed` telemetry will be sent.
2. **Inspect Page**: Open the job page in Chrome, right-click the job description/title, and select "Inspect".
3. **Find Selector**: Look for a stable class name or ID. Avoid dynamic classes (e.g., `css-12345`).
4. **Test Console**: Run `document.querySelector('YOUR_SELECTOR').innerText` in the console to verify.
5. **Update Code**: Add the new selector to the *beginning* of the array in `JOB_SELECTORS`.
6. **Verify**: Run the automated tests: `node extension/tests/run_tests.js`.

## Adding a New Job Board
1. Add a new key to `JOB_SELECTORS`.
2. Update `detectJobBoard` function to recognize the hostname.
3. Add selectors for description, title, and company.

## Testing
Run the selector syntax validation tests:
```bash
node extension/tests/run_tests.js
```
Note: This requires `jsdom` (installed in `frontend/node_modules`).
