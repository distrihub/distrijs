import { ComponentType, ReactElement, ReactNode, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { DistriChatMessage } from '@distri/core';
import type { ChatStore, HidePartFn, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from './types';
import { MessageRenderer } from './renderers/MessageRenderer';
import { resolveVisibleMessages } from './messageVisibility';
import { useDistriTheme } from './theme';

const NO_EXTERNAL_TOOLS: NonNullable<ReturnType<ChatStore['getState']>['externalTools']> = [];

export interface ChatMessageListProps {
  messages: DistriChatMessage[];
  store: ChatStore;
  rendering?: RenderingMode;
  renderMessage?: (message: DistriChatMessage) => ReactNode;
  toolRenderers?: NativeToolRendererMap;
  /**
   * A FlatList-compatible component. Screens inside a bottom sheet pass the
   * sheet's own list (e.g. `BottomSheetFlatList`) so scrolling and dragging
   * don't fight.
   */
  ListComponent?: ComponentType<any>;
  ListHeaderComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  /** Keep the newest message in view as the transcript grows. Default true. */
  autoScroll?: boolean;
  /**
   * Hide individual message parts. Defaults to hiding parts flagged
   * `developer: true` in `message.metadata.parts`.
   */
  hideParts?: HidePartFn;
}

export function ChatMessageList({
  messages,
  store,
  rendering = 'minimal',
  renderMessage,
  toolRenderers,
  ListComponent = FlatList,
  ListHeaderComponent,
  ListFooterComponent,
  autoScroll = true,
  hideParts,
}: ChatMessageListProps) {
  const theme = useDistriTheme();
  const toolCalls = useStore(store, state => state.toolCalls) as Map<string, ToolCallState>;
  const externalTools = useStore(store, state => state.externalTools ?? NO_EXTERNAL_TOOLS);
  const visible = useMemo(() => resolveVisibleMessages(messages, hideParts), [messages, hideParts]);
  const listRef = useRef<{ scrollToEnd?: (options?: { animated?: boolean }) => void } | null>(null);
  // Jump to the newest message when a thread first renders; animate after that.
  const scrolledOnce = useRef(false);
  const scrollToEnd = () => {
    listRef.current?.scrollToEnd?.({ animated: scrolledOnce.current });
    scrolledOnce.current = true;
  };

  const renderItem = ({ item }: { item: DistriChatMessage; index: number }) => (
    <View style={styles.item}>
      {renderMessage
        ? renderMessage(item)
        : <MessageRenderer message={item} store={store} toolCalls={toolCalls} externalTools={externalTools} rendering={rendering} toolRenderers={toolRenderers} />}
    </View>
  );
  return (
    <ListComponent
      ref={listRef}
      accessibilityLabel="Chat messages"
      data={visible}
      keyExtractor={(item: DistriChatMessage, index: number) => (item as { id?: string }).id || `${(item as { type?: string }).type || 'message'}-${index}`}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={[styles.content, theme.styles.list]}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={autoScroll ? scrollToEnd : undefined}
    />
  );
}

const styles = StyleSheet.create({ item: { width: '100%' }, content: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 } });
