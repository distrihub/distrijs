import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

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
      '@distri/core': path.resolve(__dirname, '../../core/src'),
      // Point lucide-react directly at its CJS build to avoid missing ESM entry issue
      'lucide-react': path.resolve(__dirname, '../node_modules/lucide-react/dist/cjs/lucide-react.js'),
    };
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
