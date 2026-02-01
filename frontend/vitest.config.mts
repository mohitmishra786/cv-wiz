import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    deps: {
      inline: [/@testing-library\/react/, /react-dom/],
    },
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        execArgv: ['--experimental-vm-modules'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
