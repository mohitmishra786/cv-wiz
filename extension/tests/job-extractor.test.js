
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Job Extractor', () => {
    let extractor;
    let dom;

    beforeEach(() => {
        // Setup JSDOM
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'https://www.linkedin.com/jobs/view/123'
        });
        
        // Setup globals
        global.window = dom.window;
        global.document = dom.window.document;
        global.chrome = {
            runtime: {
                sendMessage: vi.fn(),
                onMessage: { addListener: vi.fn() },
                lastError: null
            },
            storage: {
                local: { set: vi.fn() },
                sync: { get: vi.fn() }
            }
        };
        
        // Read script
        const scriptPath = path.resolve(__dirname, '../content/job-extractor.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Mock module context
        const module = { exports: {} };
        
        // Execute script in global scope (mimicking browser but with module injection)
        // We use new Function to avoid strict mode issues with eval if any, but eval is fine
        // We need to pass 'module' into the scope
        const runScript = new Function('module', 'window', 'document', 'chrome', scriptContent);
        runScript(module, global.window, global.document, global.chrome);
        
        extractor = module.exports;
    });

    it('should export selectors', () => {
        expect(extractor.JOB_SELECTORS).toBeDefined();
        expect(extractor.JOB_SELECTORS.linkedin).toBeDefined();
    });

    it('should detect linkedin job board', () => {
        expect(extractor.detectJobBoard()).toBe('linkedin');
    });

    it('should extract text from element', () => {
        const div = document.createElement('div');
        div.innerHTML = '  Hello   \n\n World  ';
        expect(extractor.extractText(div)).toBe('Hello\n\nWorld');
    });
    
    it('should have valid selectors syntax', () => {
        for (const board in extractor.JOB_SELECTORS) {
            const selectors = extractor.JOB_SELECTORS[board];
            ['description', 'title', 'company'].forEach(field => {
                selectors[field].forEach(selector => {
                    // Check if selector throws error
                    expect(() => document.querySelector(selector)).not.toThrow();
                });
            });
        }
    });
});
