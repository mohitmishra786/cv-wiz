import '@testing-library/jest-dom';

// Polyfill React.act for React 19 compatibility with testing-library
// This needs to happen before any React imports
import React from 'react';

// Polyfill for React 19 - React.act is available as a static method
if (!globalThis.React) {
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
}
