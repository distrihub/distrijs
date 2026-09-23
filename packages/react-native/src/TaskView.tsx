import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Agent, DistriChatMessage } from '@distri/core';
import { useStore } from 'zustand';
import type { ChatStore } from '@distri/state';
import { childTaskIdSet } from '@distri/state';
import { ChatMessageList } from './ChatMessageList';
import { useTaskStreaming } from './useTaskStreaming';
import type { NativeToolRendererMap, RenderingMode } from './types';
import { ContextRow } from './renderers/ContextRow';
import { SubTaskTree } from './renderers/SubTaskTree';

export interface TaskViewProps {
  agent: Agent | null;
  taskId: string | null;
  initialMessages?: DistriChatMessage[];
  enabled?: boolean;
  rendering?: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
  threadId?: string;
  showContextRow?: boolean;
  emptyState?: ReactNode;
  onError?: (error: Error) => void;
  store?: ChatStore;
}

/** Follow an existing task in native UI without a message composer. */
export function TaskView({
  agent,
  taskId,
  initialMessages,
  enabled = true,
  rendering = 'minimal',
  toolRenderers,
  showContextRow = true,
  emptyState,
  onError,
  store: providedStore,
}: TaskViewProps) {
  const task = useTaskStreaming({ agent, taskId, initialMessages, enabled, onError, store: providedStore });
  const tasks = useStore(task.store, state => state.tasks);
  const childIds = childTaskIdSet(tasks);
  const todos = useStore(task.store, state => state.todos);
  const contextBudget = useStore(task.store, state => state.contextBudget);
  const streamingIndicator = useStore(task.store, state => state.streamingIndicator);
  const currentThought = useStore(task.store, state => state.currentThought);
  const hasContent = task.messages.length > 0 || task.isStreaming;

  return (
    <View style={styles.container} accessibilityLabel="Task activity">
      {taskId && <Text style={styles.title}>Task {taskId}</Text>}
      {task.error && <Text accessibilityRole="alert" style={styles.error}>{task.error.message}</Text>}
      {task.isStreaming && <ActivityIndicator accessibilityLabel="Task is streaming" style={styles.spinner} />}
      {!hasContent && (emptyState ?? <Text style={styles.empty}>No task activity yet.</Text>)}
      <ChatMessageList messages={task.messages.filter(message => !childIds.has((message as { taskId?: string }).taskId ?? ''))} store={task.store} rendering={rendering} toolRenderers={toolRenderers} />
      <SubTaskTree tasks={tasks} rootTaskId={taskId} messages={task.messages} store={task.store} rendering={rendering} toolRenderers={toolRenderers} />
      {showContextRow && <ContextRow todos={todos} isStreaming={task.isStreaming} streamingIndicator={streamingIndicator} currentThought={currentThought} contextBudget={contextBudget} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { paddingHorizontal: 16, paddingTop: 12, color: '#0f172a', fontSize: 17, fontWeight: '700' },
  error: { color: '#b91c1c', paddingHorizontal: 16, paddingVertical: 8 },
  spinner: { marginVertical: 8 },
  empty: { padding: 16, color: '#64748b' },
});
