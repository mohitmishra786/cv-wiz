
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Load jsdom from extension's own node_modules
const { JSDOM } = require('jsdom');

// Mock browser
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.linkedin.com/jobs/view/123'
});
global.window = dom.window;
global.document = dom.window.document;
global.chrome = {
    runtime: {
        sendMessage: () => {},
        onMessage: { addListener: () => {} },
        lastError: null
    },
    storage: {
        local: { set: () => {} },
        sync: { get: () => Promise.resolve({}) }
    }
};

// Load script
const scriptPath = path.resolve(__dirname, '../content/job-extractor.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

const moduleMock = { exports: {} };
const runScript = new Function('module', 'window', 'document', 'chrome', scriptContent);
runScript(moduleMock, global.window, global.document, global.chrome);

const extractor = moduleMock.exports;

// Tests
console.log('Running tests...');

try {
    assert.ok(extractor.JOB_SELECTORS, 'JOB_SELECTORS should be exported');
    console.log('PASS: Export selectors');

    assert.strictEqual(extractor.detectJobBoard(), 'linkedin', 'Should detect linkedin');
    console.log('PASS: Detect job board');

    const div = document.createElement('div');
    div.innerHTML = '  Hello   \n\n World  ';
    assert.strictEqual(extractor.extractText(div), 'Hello\n\nWorld', 'Should extract text');
    console.log('PASS: Extract text');

    // Selectors syntax check
    for (const board in extractor.JOB_SELECTORS) {
        const selectors = extractor.JOB_SELECTORS[board];
        ['description', 'title', 'company'].forEach(field => {
            selectors[field].forEach(selector => {
                try {
                    document.querySelector(selector);
                } catch (e) {
                    throw new Error(`Invalid selector for ${board}.${field}: ${selector}`);
                }
            });
        });
    }
    console.log('PASS: Selector syntax valid');

    console.log('All tests passed!');
} catch (e) {
    console.error('TEST FAILED:', e);
    process.exit(1);
}
