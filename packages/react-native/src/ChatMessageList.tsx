import { ComponentType, ReactElement, ReactNode, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { DistriChatMessage } from '@distri/core';
import { buildTranscript } from '@distri/state';
import type { ChatStore, HidePartFn, SummaryFn, TaskState, ToolCallState, TranscriptBlock } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from './types';
import { TranscriptBlockView } from './renderers/TranscriptBlock';
import { nestedTaskIds, SubTaskContext } from './renderers/SubTaskCard';
import { hasNativeContent } from './messageVisibility';
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
  /** `'none'` (default): a card per tool call. `'run'`: fold consecutive tool calls into one "N steps" row. */
  groupToolCalls?: 'none' | 'run';
  /** Teacher-facing label per tool name, used in the card title and the folded row. */
  toolLabels?: Record<string, string>;
  /** Per-tool summary overrides for step labels. */
  toolSummaryOverrides?: Record<string, SummaryFn>;
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
  groupToolCalls = 'none',
  toolLabels,
  toolSummaryOverrides,
}: ChatMessageListProps) {
  const theme = useDistriTheme();
  const toolCalls = useStore(store, state => state.toolCalls) as Map<string, ToolCallState>;
  const externalTools = useStore(store, state => state.externalTools ?? NO_EXTERNAL_TOOLS);
  const tasks = useStore(store, state => state.tasks) as Map<string, TaskState>;
  // A sub-agent started by a tool call in this list is drawn under that call
  // (SubTaskCard); its own messages stay out of the flat list.
  const nested = useMemo(() => nestedTaskIds(messages, tasks), [messages, tasks]);
  // Blocks, not raw messages: stored tool calls (a reloaded thread) become steps
  // and runs fold, the same model @distri/react draws.
  const blocks = useMemo(
    () => buildTranscript(messages, {
      hidePart: hideParts,
      groupToolCalls,
      isDisplayable: hasNativeContent,
      excludeMessage: m => nested.has((m as { taskId?: string }).taskId ?? ''),
    }),
    [messages, hideParts, groupToolCalls, nested],
  );
  const scope = useMemo(
    () => ({ messages, tasks, groupToolCalls, toolLabels, toolSummaryOverrides, hideParts }),
    [messages, tasks, groupToolCalls, toolLabels, toolSummaryOverrides, hideParts],
  );
  const listRef = useRef<{ scrollToEnd?: (options?: { animated?: boolean }) => void } | null>(null);
  // Jump to the newest message when a thread first renders; animate after that.
  const scrolledOnce = useRef(false);
  const scrollToEnd = () => {
    listRef.current?.scrollToEnd?.({ animated: scrolledOnce.current });
    scrolledOnce.current = true;
  };

  const ctx = { store, toolCalls, externalTools, rendering, toolRenderers, groupToolCalls, toolLabels, toolSummaryOverrides };
  const renderItem = ({ item }: { item: TranscriptBlock; index: number }) => (
    <View style={styles.item}>
      {renderMessage && item.kind !== 'steps'
        ? renderMessage(item.message)
        : <TranscriptBlockView block={item} ctx={ctx} />}
    </View>
  );
  return (
    <SubTaskContext.Provider value={scope}>
      <ListComponent
        ref={listRef}
        accessibilityLabel="Chat messages"
        data={blocks}
        keyExtractor={(item: TranscriptBlock) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={[styles.content, theme.styles.list]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={autoScroll ? scrollToEnd : undefined}
      />
    </SubTaskContext.Provider>
  );
}

const styles = StyleSheet.create({ item: { width: '100%' }, content: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 } });
