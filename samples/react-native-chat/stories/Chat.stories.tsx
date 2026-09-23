import { useMemo } from 'react';
import type { Agent, DistriChatMessage, DistriEvent } from '@distri/core';
import { DistriClient, extractTextFromDistriMessage, isDistriMessage } from '@distri/core';
import type { Meta, StoryObj } from '@storybook/react-native';
import { Chat, type ChatProps } from '@distri/react-native';
import { Text, View } from 'react-native';

const meta: Meta<typeof Chat> = {
  title: 'Distri Native/Chat',
  component: Chat,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Chat>;

type DemoMode = 'reply' | 'error';

function makeAgent(mode: DemoMode = 'reply'): Agent {
  let responseNumber = 0;
  return {
    name: 'storybook-native-agent',
    client: { ensureAccessToken: async () => undefined },
    invokeStream: async () => {
      if (mode === 'error') throw new Error('Demo connection error — try the Reply story.');
      responseNumber += 1;
      return responseStream(`storybook-reply-${responseNumber}`);
    },
  } as unknown as Agent;
}

async function* responseStream(messageId: string): AsyncGenerator<DistriEvent> {
  const stepId = `${messageId}-step`;
  yield {
    type: 'text_message_start',
    data: { message_id: messageId, step_id: stepId, role: 'assistant', is_final: true },
  };
  for (const delta of ['This is a ', 'native Distri ', 'streaming response.']) {
    await new Promise(resolve => setTimeout(resolve, 450));
    yield { type: 'text_message_content', data: { message_id: messageId, step_id: stepId, delta } };
  }
  yield { type: 'text_message_end', data: { message_id: messageId, step_id: stepId } };
}

const conversation: DistriChatMessage[] = [
  DistriClient.initDistriMessage('user', [{ part_type: 'text', data: 'What can this native chat do?' }]),
  DistriClient.initDistriMessage('assistant', [{ part_type: 'text', data: 'Send a message below to see a chunked response arrive live.' }]),
];

function CustomMessage({ message }: { message: DistriChatMessage }) {
  if (!isDistriMessage(message)) {
    return <Text style={styles.event}>Stream event: {message.type}</Text>;
  }
  const isUser = message.role === 'user';
  return (
    <View style={[styles.customRow, isUser ? styles.customUserRow : styles.customAssistantRow]}>
      {!isUser && <Text style={styles.avatar}>D</Text>}
      <View style={[styles.customBubble, isUser ? styles.customUserBubble : styles.customAssistantBubble]}>
        <Text style={[styles.customText, isUser && styles.customUserText]}>
          {extractTextFromDistriMessage(message) || 'Non-text message — customize this renderer in your app.'}
        </Text>
      </View>
    </View>
  );
}

function ChatStory({ mode = 'reply', initialMessages, custom = false }: {
  mode?: DemoMode;
  initialMessages?: DistriChatMessage[];
  custom?: boolean;
}) {
  const agent = useMemo(() => makeAgent(mode), [mode]);
  const props: ChatProps = {
    agent,
    threadId: `storybook-${mode}-${custom ? 'custom' : 'default'}`,
    initialMessages,
    ...(custom ? { renderMessage: message => <CustomMessage message={message} /> } : {}),
  };
  return (
    <View style={styles.chatFrame}>
      <Text style={styles.hint}>Type a prompt and tap Send to try this story.</Text>
      <Chat {...props} />
    </View>
  );
}

export const Empty: Story = {
  render: () => <ChatStory />,
  name: 'Empty — ready to chat',
};

export const Conversation: Story = {
  render: () => <ChatStory initialMessages={conversation} />,
};

export const IncrementalStream: Story = {
  render: () => <ChatStory initialMessages={conversation} />,
  name: 'Streaming — send to see deltas',
  parameters: { docs: { description: { story: 'The demo agent sends three delayed text deltas so streaming can be observed on-device.' } } },
};

export const ConnectionError: Story = {
  render: () => <ChatStory mode="error" />,
};

export const CustomMessageRenderer: Story = {
  render: () => <ChatStory initialMessages={conversation} custom />,
};

const styles = {
  chatFrame: { flex: 1, minHeight: 520, backgroundColor: '#f8fafc' },
  hint: { paddingHorizontal: 16, paddingVertical: 10, color: '#475569', fontSize: 13 },
  customRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 8, paddingVertical: 5 },
  customUserRow: { justifyContent: 'flex-end' as const },
  customAssistantRow: { justifyContent: 'flex-start' as const },
  customBubble: { maxWidth: '84%' as const, padding: 13, borderRadius: 17 },
  customUserBubble: { backgroundColor: '#1d4ed8', borderBottomRightRadius: 5 },
  customAssistantBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  customText: { color: '#111827', fontSize: 15, lineHeight: 21 },
  customUserText: { color: '#ffffff' },
  avatar: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' as const, textAlign: 'center' as const, textAlignVertical: 'center' as const, color: '#ffffff', backgroundColor: '#0f172a', fontWeight: '700' as const },
  event: { padding: 12, color: '#64748b', fontSize: 12 },
};
