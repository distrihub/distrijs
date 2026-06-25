import type { Meta, StoryObj } from '@storybook/react';
import { ContextUsagePanel } from './ContextUsagePanel';
import type { ContextBudget } from '@distri/core';

const meta: Meta<typeof ContextUsagePanel> = {
  title: 'Compaction/ContextUsagePanel',
  component: ContextUsagePanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ContextUsagePanel>;

function makeBudget(overrides: Partial<ContextBudget> = {}): ContextBudget {
  return {
    system_prompt_static_tokens: 4_100,
    system_prompt_dynamic_tokens: 1_200,
    tool_schema_tokens: 5_400,
    deferred_tool_tokens: 800,
    skill_listing_tokens: 600,
    conversation_tokens: 1_500,
    tool_result_tokens: 320,
    context_window_size: 200_000,
    static_prefix_cache_hit: true,
    ...overrides,
  };
}

export const Empty: Story = {
  name: 'Empty (first render)',
  args: { budget: undefined, compactions: [] },
};

export const FreshConversation: Story = {
  name: 'Fresh conversation',
  args: {
    budget: makeBudget(),
    compactions: [],
    onCompact: () => {},
  },
};

export const Warning: Story = {
  name: 'Warning band (78%)',
  args: {
    budget: makeBudget({
      conversation_tokens: 138_000,
      tool_result_tokens: 5_400,
    }),
    compactions: [],
    onCompact: () => {},
  },
};

export const Critical: Story = {
  name: 'Critical (92%)',
  args: {
    budget: makeBudget({
      conversation_tokens: 168_000,
      tool_result_tokens: 8_200,
      static_prefix_cache_hit: false,
    }),
    compactions: [],
    onCompact: () => {},
  },
};

export const Compacting: Story = {
  name: 'Compaction in flight',
  args: {
    budget: makeBudget({
      conversation_tokens: 152_000,
      tool_result_tokens: 6_800,
    }),
    compactions: [],
    isCompacting: true,
    onCompact: () => {},
  },
};

export const WithCompactionLog: Story = {
  name: 'After several compactions',
  args: {
    budget: makeBudget({
      conversation_tokens: 38_400,
      tool_result_tokens: 2_100,
    }),
    compactions: [
      {
        ts: Date.now() - 12 * 60_000,
        before: 158_000,
        after: 64_000,
        tier: 'trim',
        source: 'auto',
      },
      {
        ts: Date.now() - 6 * 60_000,
        before: 172_000,
        after: 82_000,
        tier: 'summarize',
        source: 'auto',
      },
      {
        ts: Date.now() - 90_000,
        before: 124_000,
        after: 41_000,
        tier: 'trim',
        source: 'manual',
      },
    ],
    onCompact: () => {},
  },
};

export const EmergencyReset: Story = {
  name: 'Emergency reset just fired',
  args: {
    budget: makeBudget({
      conversation_tokens: 6_400,
      tool_result_tokens: 800,
      static_prefix_cache_hit: false,
    }),
    compactions: [
      {
        ts: Date.now() - 2_000,
        before: 192_000,
        after: 12_400,
        tier: 'reset',
        source: 'auto',
      },
    ],
    onCompact: () => {},
  },
};

export const WithoutCompactButton: Story = {
  name: 'Read-only (no Compact button)',
  args: {
    budget: makeBudget({
      conversation_tokens: 88_000,
    }),
    compactions: [],
    // onCompact omitted → button hidden
  },
};
