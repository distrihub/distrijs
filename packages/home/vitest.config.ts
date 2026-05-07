import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@distri/components': resolve(__dirname, '../components/src/index.ts'),
      '@distri/core': resolve(__dirname, '../core/src/index.ts'),
      '@distri/react': resolve(__dirname, '../react/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
