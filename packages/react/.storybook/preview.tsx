import type { Preview } from '@storybook/react';
import './preview-styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="distri-root p-4 min-h-screen bg-background font-sans">
        <Story />
      </div>
    ),
  ],
};

export default preview;
