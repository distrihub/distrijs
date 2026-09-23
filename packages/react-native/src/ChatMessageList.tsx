import { ReactNode } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { DistriChatMessage } from '@distri/core';
import type { ChatStore, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from './types';
import { MessageRenderer } from './renderers/MessageRenderer';

const NO_EXTERNAL_TOOLS: NonNullable<ReturnType<ChatStore['getState']>['externalTools']> = [];

export interface ChatMessageListProps {
  messages: DistriChatMessage[];
  store: ChatStore;
  rendering?: RenderingMode;
  renderMessage?: (message: DistriChatMessage) => ReactNode;
  toolRenderers?: NativeToolRendererMap;
}

export function ChatMessageList({ messages, store, rendering = 'minimal', renderMessage, toolRenderers }: ChatMessageListProps) {
  const toolCalls = useStore(store, state => state.toolCalls) as Map<string, ToolCallState>;
  const externalTools = useStore(store, state => state.externalTools ?? NO_EXTERNAL_TOOLS);
  const renderItem = ({ item }: { item: DistriChatMessage; index: number }) => (
    <View style={styles.item}>
      {renderMessage
        ? renderMessage(item)
        : <MessageRenderer message={item} store={store} toolCalls={toolCalls} externalTools={externalTools} rendering={rendering} toolRenderers={toolRenderers} />}
    </View>
  );
  return (
    <FlatList
      accessibilityLabel="Chat messages"
      data={messages}
      keyExtractor={(item, index) => (item as { id?: string }).id || `${(item as { type?: string }).type || 'message'}-${index}`}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({ item: { width: '100%' }, content: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 } });
