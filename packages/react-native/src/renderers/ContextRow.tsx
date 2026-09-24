import { StyleSheet, Text, View } from 'react-native';
import type { ContextBudget, TodoItem } from '@distri/core';

export interface ContextRowProps {
  todos: TodoItem[];
  isStreaming: boolean;
  streamingIndicator?: string;
  currentThought?: string;
  contextBudget?: ContextBudget;
}

export function ContextRow({ todos, isStreaming, streamingIndicator, currentThought, contextBudget }: ContextRowProps) {
  const activeTodos = todos.filter(todo => todo.status !== 'done');
  const totalTokens = contextBudget
    ? contextBudget.system_prompt_static_tokens + contextBudget.system_prompt_dynamic_tokens + contextBudget.tool_schema_tokens + contextBudget.deferred_tool_tokens + contextBudget.skill_listing_tokens + contextBudget.conversation_tokens + contextBudget.tool_result_tokens
    : null;
  const budget = contextBudget?.context_window_size;
  const percent = totalTokens !== null && budget ? Math.min(100, Math.round(totalTokens / budget * 100)) : null;

  if (!isStreaming && !activeTodos.length && percent === null) return null;
  return (
    <View accessibilityLabel="Task context and progress" style={styles.container}>
      {(isStreaming || currentThought) && <Text style={styles.thinking}>{currentThought || streamingIndicator || 'Working…'}</Text>}
      {activeTodos.length > 0 && (
        <View style={styles.todos}>
          {activeTodos.map(todo => <Text key={todo.id} style={styles.todo}>• {todo.status === 'in_progress' ? '◉' : '○'} {todo.content}</Text>)}
        </View>
      )}
      {percent !== null && <Text style={styles.budget}>Context {percent}% used</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  thinking: { color: '#475569', fontSize: 12 },
  todos: { gap: 3 },
  todo: { color: '#334155', fontSize: 12 },
  budget: { color: '#64748b', fontSize: 11 },
});
