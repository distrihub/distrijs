import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DistriChatMessage, DistriEvent, DistriMessage, isDistriEvent, isDistriMessage } from '@distri/core';
import type { ChatStore, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';
import { DistriPartRenderer } from './partRenderers';
import { HIDDEN_TOOL_NAMES, isVisibleMessage, isVisiblePart } from '../messageVisibility';
import { DistriNativeTheme, useDistriTheme } from '../theme';

interface MessageRendererProps {
  message: DistriChatMessage;
  store: ChatStore;
  toolCalls: Map<string, ToolCallState>;
  externalTools: NonNullable<ReturnType<ChatStore['getState']>['externalTools']>;
  rendering: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
}

export function MessageRenderer({ message, store, toolCalls, externalTools, rendering, toolRenderers }: MessageRendererProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!isVisibleMessage(message)) return null;
  if (isDistriMessage(message)) {
    const msg = message as DistriMessage;
    const isUser = msg.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble, isUser ? theme.styles.userBubble : theme.styles.assistantBubble]}>
          {msg.parts.filter(isVisiblePart).map((part, index) => <DistriPartRenderer key={index} part={part} isUser={isUser} toolCalls={toolCalls} externalTools={externalTools} store={store} rendering={rendering} toolRenderers={toolRenderers} />)}
        </View>
      </View>
    );
  }

  if (isDistriEvent(message)) {
    const event = message as DistriEvent;
    if (event.type === 'tool_calls') {
      return <ToolExecutionRenderer toolCalls={event.data.tool_calls.filter(call => !HIDDEN_TOOL_NAMES.has(call.tool_name))} states={toolCalls} tools={externalTools} store={store} renderers={toolRenderers} rendering={rendering} />;
    }
    if (event.type === 'agent_handover') return <View style={styles.eventCard}><Text style={styles.eventTitle}>Handing over to {event.data.to_agent}</Text></View>;
    if (event.type === 'run_error') return <Text accessibilityRole="alert" style={styles.error}>{event.data.message}</Text>;
    if (event.type === 'todos_updated') {
      const todos = event.data.todos ?? [];
      return <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>Task progress · {event.data.todo_count} items</Text>
        {todos.length > 0
          ? todos.map(todo => <Text key={todo.id} style={styles.detail}>{todo.status === 'done' ? '✓' : todo.status === 'in_progress' ? '◉' : '○'} {todo.content}</Text>)
          : <Text style={styles.detail}>{event.data.formatted_todos || event.data.action}</Text>}
      </View>;
    }
    if (event.type === 'live_view') {
      const title = event.data.title || 'Live preview';
      return <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{title}</Text>
        <Text selectable style={styles.detail}>{event.data.url}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title}`} onPress={() => { void Linking.openURL(event.data.url); }} style={styles.openButton}>
          <Text style={styles.openButtonText}>Open preview</Text>
        </Pressable>
      </View>;
    }
    if (event.type === 'context_compaction') {
      const { tier, tokens_before, tokens_after, summary } = event.data;
      return <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>Context {tier === 'summarize' ? 'summarized' : tier === 'trim' ? 'trimmed' : 'reset'}</Text>
        <Text style={styles.detail}>{tokens_before.toLocaleString()} → {tokens_after.toLocaleString()} tokens</Text>
        {summary ? <Text style={styles.detail}>{summary}</Text> : null}
      </View>;
    }
    return null;
  }

  return <Text style={styles.fallback}>{JSON.stringify(message)}</Text>;
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', paddingVertical: 3 },
    userRow: { justifyContent: 'flex-end' },
    assistantRow: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '88%', borderRadius: theme.radii.bubble, paddingVertical: 11, paddingHorizontal: 13, gap: 8 },
    userBubble: { backgroundColor: theme.colors.userBubble, borderTopRightRadius: 5 },
    assistantBubble: { backgroundColor: theme.colors.assistantBubble, borderWidth: 1, borderColor: theme.colors.assistantBorder, borderTopLeftRadius: 5 },
    detail: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    fallback: { color: theme.colors.mutedText, fontSize: 13, padding: 8 },
    eventCard: { borderLeftWidth: 3, borderLeftColor: theme.colors.accent, backgroundColor: theme.colors.surface, borderRadius: 8, padding: 10, gap: 4 },
    eventTitle: { color: theme.colors.text, fontWeight: '600', fontFamily: theme.fonts.body },
    openButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: theme.colors.codeBackground },
    openButtonText: { color: theme.colors.accent, fontWeight: '600', fontSize: theme.fontSizes.small },
    error: { color: theme.colors.danger, padding: 8, fontFamily: theme.fonts.body },
  });
}
