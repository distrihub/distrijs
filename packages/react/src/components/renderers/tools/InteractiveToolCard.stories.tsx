import type { Meta } from '@storybook/react';
import { InteractiveToolCard } from '@distri/react';
import type { ToolCallState } from '@distri/react';

const meta: Meta = {
  title: 'Tools/InteractiveTool',
  parameters: { layout: 'padded' },
};
export default meta;

const pendingState: ToolCallState = {
  tool_call_id: 'tc-ask',
  tool_name: 'ask_follow_up',
  input: {},
  status: 'pending',
};

export const AskFollowUpRich = {
  render: () => (
    <InteractiveToolCard
      toolCall={{
        tool_call_id: 'tc-ask',
        tool_name: 'ask_follow_up',
        input: {
          question: 'What should I name this activity?',
          fields: [
            { name: 'activity_name', type: 'string', label: 'Activity name', required: true },
            { name: 'grading_mode', type: 'enum', label: 'Grading mode', options: ['auto', 'manual'], default: 'auto' },
          ],
        },
      }}
      state={pendingState}
      rendering="rich"
      onComplete={(r) => console.log('completed', r)}
    />
  ),
};

export const AskFollowUpMinimal = {
  render: () => (
    <InteractiveToolCard
      toolCall={{
        tool_call_id: 'tc-ask2',
        tool_name: 'ask_follow_up',
        input: {
          question: 'What should I name this activity?',
          fields: [{ name: 'name', type: 'string', required: true }],
        },
      }}
      state={{ ...pendingState, tool_call_id: 'tc-ask2' }}
      rendering="minimal"
      onComplete={(r) => console.log('completed', r)}
    />
  ),
};

export const ConfirmRich = {
  render: () => (
    <InteractiveToolCard
      toolCall={{
        tool_call_id: 'tc-confirm',
        tool_name: 'confirm',
        input: { question: 'Are you sure you want to delete all submissions?' },
      }}
      state={{ ...pendingState, tool_call_id: 'tc-confirm', tool_name: 'confirm' }}
      rendering="rich"
      onComplete={(r) => console.log('confirmed', r)}
    />
  ),
};
