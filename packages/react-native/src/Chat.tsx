import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DistriChatMessage } from '@distri/core';
import { ChatInput } from './ChatInput';
import { UseChatOptions, useChat } from './useChat';
import { ChatMessageList } from './ChatMessageList';
import type { NativeToolRendererMap, RenderingMode } from './types';

export interface ChatProps extends UseChatOptions {
  renderMessage?: (message: DistriChatMessage) => ReactNode;
  rendering?: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
  placeholder?: string;
}

export function Chat({ renderMessage, rendering = 'minimal', toolRenderers, placeholder, ...chatOptions }: ChatProps) {
  const chat = useChat(chatOptions);

  return (
    <View style={styles.container}>
      <ChatMessageList messages={chat.messages} store={chat.store} rendering={rendering} renderMessage={renderMessage} toolRenderers={toolRenderers} />
      {chat.isLoading && <ActivityIndicator accessibilityLabel="Assistant is responding" style={styles.spinner} />}
      {chat.error && <Text accessibilityRole="alert" style={styles.error}>{chat.error.message}</Text>}
      <ChatInput
        onSend={text => chat.sendMessage(text)}
        onStop={chat.isStreaming ? chat.stopStreaming : undefined}
        disabled={!chatOptions.agent || (chat.isLoading && !chat.isStreaming)}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  spinner: { marginVertical: 8 },
  error: { paddingHorizontal: 16, paddingBottom: 8, color: '#b91c1c' },
});
