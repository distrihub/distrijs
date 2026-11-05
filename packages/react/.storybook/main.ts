import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      '@distri/react': path.resolve(__dirname, '../src/index.ts'),
      '@distri/core': path.resolve(__dirname, '../../core/src'),
      // Point lucide-react directly at its CJS build to avoid missing ESM entry issue
      'lucide-react': path.resolve(__dirname, '../node_modules/lucide-react/dist/cjs/lucide-react.js'),
    };
    // The library build scopes every selector to a Distri root (postcss-distri-scope),
    // which rejects the preview's own :root. Storybook is the host app here, so skip it.
    config.css = { ...config.css, postcss: { plugins: [tailwindcss(), autoprefixer()] } };
    config.optimizeDeps = config.optimizeDeps ?? {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include ?? []),
      'react',
      'react-dom',
      'zustand',
    ];
    return config;
  },
};

export default config;
