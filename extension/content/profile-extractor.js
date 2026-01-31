/**
 * CV-Wiz Profile Extractor
 * Extracts user profile data from LinkedIn
 */

(function () {
    'use strict';

    if (window.cvWizProfileExtractorInjected) return;
    window.cvWizProfileExtractorInjected = true;

    function extractText(selector, parent = document) {
        const el = parent.querySelector(selector);
        return el ? el.innerText.trim() : '';
    }

    function extractLinkedInProfile() {
        const profile = {
            name: extractText('h1.text-heading-xlarge'),
            about: extractText('.display-flex.ph5.pv3 .inline-show-more-text--is-collapsed'),
            experiences: [],
            educations: [],
            skills: []
        };

        // Experience
        // Note: Selectors are fragile and change often. Using generic anchors where possible.
        const expSection = document.getElementById('experience');
        if (expSection) {
            // Traverse up to find the section container, then find list items
            // This is a simplified logic and might need adjustment for actual LinkedIn DOM
            // LinkedIn is very complex with nested Shadow DOMs or obfuscated classes sometimes.
            // We'll try to find common patterns.
            
            // NOTE: Implementing a robust scraper here is difficult without live DOM.
            // This is a placeholder for the logic.
            console.log('[CV-Wiz] Experience extraction requires complex traversal.');
        }

        return profile;
    }

    // Floating button on Profile Page
    function createImportButton() {
        const button = document.createElement('button');
        button.innerText = 'Import Profile to CV-Wiz';
        button.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 9999;
            padding: 12px 20px;
            background: #0a66c2;
            color: white;
            border: none;
            border-radius: 24px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        button.onclick = () => {
            const data = extractLinkedInProfile();
            // Since scraping is hard, let's just scrape the name for now as proof of concept
            // and maybe open a manual entry form or redirect to CV-Wiz
            alert('Profile import started! (Basic data only in this version)');
            
            chrome.runtime.sendMessage({
                type: 'IMPORT_PROFILE',
                payload: data
            });
        };

        document.body.appendChild(button);
    }

    // Only run on profile pages
    if (window.location.href.includes('/in/')) {
        // Wait for load
        setTimeout(createImportButton, 2000);
    }

})();
