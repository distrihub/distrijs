import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@distri/core': path.resolve(__dirname, '../packages/core/src'),
      '@distri/react': path.resolve(__dirname, '../packages/react/src'),
    },
  },
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['react/**', 'jsdom'],
      ['e2e/**/*.tsx', 'jsdom'],
      ['client/**', 'node'],
      ['e2e/**/*.ts', 'node'],
    ],
    setupFiles: ['./scripts/setup.ts'],
    server: {
      deps: {
        inline: ['@testing-library/jest-dom'],
      },
    },
  },
});
