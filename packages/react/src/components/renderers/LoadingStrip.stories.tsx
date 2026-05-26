import type { Meta, StoryObj } from '@storybook/react';
import { LoadingStrip } from '@distri/react';

const meta: Meta<typeof LoadingStrip> = {
  title: 'Tools/LoadingStrip',
  component: LoadingStrip,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof LoadingStrip>;

export const Default: Story = {};

export const CustomWords: Story = {
  args: {
    words: ['Grading submissions…', 'Analyzing responses…', 'Building report…'],
  },
};

export const DotsOnly: Story = {
  args: { words: [] },
};
