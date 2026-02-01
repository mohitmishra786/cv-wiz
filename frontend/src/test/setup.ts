import '@testing-library/jest-dom';

// Polyfill React.act for React 19 compatibility with testing-library
// This needs to happen before any React imports
import { act } from 'react';

// @ts-expect-error - Polyfill for React 19
globalThis.React = globalThis.React || {};
// @ts-expect-error - Polyfill for React 19
globalThis.React.act = act;

// Also polyfill the deprecated ReactDOMTestUtils.act for compatibility
// @ts-expect-error - Polyfill for testing-library compatibility
if (typeof globalThis.ReactDOMTestUtils === 'undefined') {
  // @ts-expect-error - Polyfill for testing-library compatibility
  globalThis.ReactDOMTestUtils = { act };
}
