import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DistriChatMessage, DistriEvent, DistriMessage, isDistriEvent, isDistriMessage } from '@distri/core';
import type { ChatStore, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';
import { DistriPartRenderer } from './partRenderers';

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

interface MessageRendererProps {
  message: DistriChatMessage;
  store: ChatStore;
  toolCalls: Map<string, ToolCallState>;
  externalTools: NonNullable<ReturnType<ChatStore['getState']>['externalTools']>;
  rendering: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
}

export function MessageRenderer({ message, store, toolCalls, externalTools, rendering, toolRenderers }: MessageRendererProps) {
  if (isDistriMessage(message)) {
    const msg = message as DistriMessage;
    if (msg.role === 'developer' || msg.role === 'system') return null;
    const isUser = msg.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {msg.parts.map((part, index) => <DistriPartRenderer key={index} part={part} isUser={isUser} toolCalls={toolCalls} externalTools={externalTools} store={store} rendering={rendering} toolRenderers={toolRenderers} />)}
        </View>
      </View>
    );
  }

  if (isDistriEvent(message)) {
    const event = message as DistriEvent;
    if (event.type === 'tool_calls') {
      return <ToolExecutionRenderer toolCalls={event.data.tool_calls} states={toolCalls} tools={externalTools} store={store} renderers={toolRenderers} rendering={rendering} />;
    }
    if (event.type === 'tool_results') {
      return <View style={styles.eventCard}><Text style={styles.eventTitle}>Tool results</Text>{event.data.results.map(result => <Text key={result.tool_call_id} style={styles.detail}>{result.tool_name}: {stringify(result.parts)}</Text>)}</View>;
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
    if (event.type === 'context_budget_update') {
      const { budget, is_warning, is_critical } = event.data;
      const used = budget.context_window_size
        ? Math.round((budget.conversation_tokens / budget.context_window_size) * 100)
        : undefined;
      return <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{is_critical ? 'Context limit critical' : is_warning ? 'Context getting full' : 'Context usage'}</Text>
        {used !== undefined ? <Text style={styles.detail}>{used}% · {budget.conversation_tokens.toLocaleString()} / {budget.context_window_size.toLocaleString()} tokens</Text> : null}
      </View>;
    }
    return null;
  }

  return <Text style={styles.fallback}>{JSON.stringify(message)}</Text>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 3 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '92%', borderRadius: 16, padding: 12, gap: 8 },
  userBubble: { backgroundColor: '#1d4ed8', borderBottomRightRadius: 5 },
  assistantBubble: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 5 },
  detail: { color: '#334155', fontSize: 12 },
  fallback: { color: '#475569', fontSize: 13, padding: 8 },
  eventCard: { borderLeftWidth: 3, borderLeftColor: '#0f766e', backgroundColor: '#f1f5f9', padding: 10, gap: 4 },
  eventTitle: { color: '#334155', fontWeight: '600' },
  openButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: '#dbeafe' },
  openButtonText: { color: '#1d4ed8', fontWeight: '600', fontSize: 12 },
  error: { color: '#b91c1c', padding: 8 },
});
