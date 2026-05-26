import type { Meta, StoryObj } from '@storybook/react';
import { ContextIndicator } from './ContextIndicator';
import type { ContextHealth } from '@distri/core';

const meta: Meta<typeof ContextIndicator> = {
  title: 'Compaction/ContextIndicator',
  component: ContextIndicator,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 12, background: '#fff' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ContextIndicator>;

function makeHealth(
  ratio: number,
  opts: Partial<ContextHealth> = {},
): ContextHealth {
  const limit = 200_000;
  return {
    usage_ratio: ratio,
    tokens_used: Math.round(limit * ratio),
    tokens_limit: limit,
    ...opts,
  };
}

export const Empty: Story = {
  name: 'Empty (no health yet)',
  args: { contextHealth: null },
};

export const LowUsage: Story = {
  name: 'Low usage (green)',
  args: { contextHealth: makeHealth(0.18) },
};

export const Medium: Story = {
  name: 'Medium usage (yellow)',
  args: { contextHealth: makeHealth(0.55) },
};

export const Warning: Story = {
  name: 'High usage (orange)',
  args: { contextHealth: makeHealth(0.78) },
};

export const Critical: Story = {
  name: 'Critical (red)',
  args: { contextHealth: makeHealth(0.92) },
};

export const RecentlyCompacted: Story = {
  name: 'Recently compacted (trim tier)',
  args: {
    contextHealth: makeHealth(0.32, {
      last_compaction: {
        type: 'context_compaction',
        tier: 'trim',
        tokens_before: 156_000,
        tokens_after: 64_000,
        entries_affected: 38,
        context_limit: 200_000,
        usage_ratio: 0.32,
        source: 'auto',
      },
    }),
  },
};

export const SummarizeTierCompaction: Story = {
  name: 'Recently compacted (summarize tier)',
  args: {
    contextHealth: makeHealth(0.41, {
      last_compaction: {
        type: 'context_compaction',
        tier: 'summarize',
        tokens_before: 178_000,
        tokens_after: 82_000,
        entries_affected: 124,
        context_limit: 200_000,
        usage_ratio: 0.41,
        source: 'manual',
        summary: 'Summarized 124 turns of work into a structured recap.',
      },
    }),
  },
};

export const Compacting: Story = {
  name: 'Compaction in progress',
  args: {
    contextHealth: makeHealth(0.83),
    isCompacting: true,
  },
};
