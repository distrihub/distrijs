import type { Meta, StoryObj } from '@storybook/react';
import { TodosCompact } from '@distri/react';

const meta: Meta<typeof TodosCompact> = {
  title: 'Tools/TodosCompact',
  component: TodosCompact,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof TodosCompact>;

const todos = [
  { id: '1', content: 'Read Google Doc', status: 'done' as const },
  { id: '2', content: 'Create activity', status: 'done' as const },
  { id: '3', content: 'Detect student submissions', status: 'in_progress' as const },
  { id: '4', content: 'Persist results', status: 'open' as const },
];

export const InProgress: Story = { args: { todos } };

export const AllDone: Story = {
  args: {
    todos: todos.map(t => ({ ...t, status: 'done' as const })),
  },
};

export const SingleTask: Story = {
  args: {
    todos: [{ id: '1', content: 'Generating lesson plan…', status: 'in_progress' as const }],
  },
};
