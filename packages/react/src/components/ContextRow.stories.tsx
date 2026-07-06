import type { Meta, StoryObj } from '@storybook/react';
import { ContextRow } from './ContextRow';
import type { ContextBudget } from '@distri/core';

/**
 * The single-line status strip above the composer: thinking indicator on
 * the left, todos chip in the middle (click → list pops upward), context
 * dial on the right (click → usage panel). One story file, one state per
 * story — the pieces are never shown stacked.
 */
const meta: Meta<typeof ContextRow> = {
  title: 'Chat/ContextRow',
  component: ContextRow,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640, marginTop: 240 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ContextRow>;

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

const todos = [
  { id: '1', content: 'Read Google Doc', status: 'done' as const },
  { id: '2', content: 'Create activity', status: 'done' as const },
  { id: '3', content: 'Detect student submissions', status: 'in_progress' as const },
  { id: '4', content: 'Persist results', status: 'open' as const },
];

export const Thinking: Story = {
  args: { isStreaming: true },
};

export const WithTodos: Story = {
  args: { todos },
};

export const WithContext: Story = {
  args: { contextBudget: makeBudget({ conversation_tokens: 98_000 }) },
};

export const ThinkingWithTodos: Story = {
  args: { isStreaming: true, todos },
};

export const Everything: Story = {
  name: 'Thinking + todos + context',
  args: {
    isStreaming: true,
    todos,
    contextBudget: makeBudget({ conversation_tokens: 138_000, tool_result_tokens: 5_400 }),
  },
};

export const WaitingForTools: Story = {
  args: {
    pendingToolCallCount: 2,
    todos,
    contextBudget: makeBudget(),
  },
};

export const Compacting: Story = {
  args: {
    isStreaming: true,
    todos,
    isCompacting: true,
    contextBudget: makeBudget({ conversation_tokens: 168_000 }),
  },
};

export const AllTasksDone: Story = {
  args: {
    todos: todos.map(t => ({ ...t, status: 'done' as const })),
    contextBudget: makeBudget(),
  },
};
