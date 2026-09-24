import type { Meta, StoryObj } from '@storybook/react-native';
import { ChatInput } from '@distri/react-native';

const meta: Meta<typeof ChatInput> = {
  title: 'Distri Native/ChatInput',
  component: ChatInput,
  args: {
    onSend: text => console.info('ChatInput sent:', text),
  },
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Ready: Story = {
  args: { placeholder: 'Message…', disabled: false },
  name: 'Ready — type a message',
};

export const Disabled: Story = {
  args: { placeholder: 'Connect an agent to start', disabled: true },
};

export const Generating: Story = {
  args: {
    placeholder: 'The assistant is responding',
    disabled: true,
    onStop: () => console.info('Stop generation pressed'),
  },
};
