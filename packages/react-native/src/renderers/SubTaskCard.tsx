import { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from 'zustand';
import type { DistriChatMessage } from '@distri/core';
import type { ChatStore, TaskState, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { MessageRenderer } from './MessageRenderer';
import { DistriNativeTheme, useDistriTheme } from '../theme';

/**
 * What a nested sub-task needs from the list around it: every message (the
 * flat list leaves a nested task's out) and the task tree. Provided by
 * `ChatMessageList`.
 */
export interface SubTaskScope {
  messages: DistriChatMessage[];
  tasks: Map<string, TaskState>;
}

export const SubTaskContext = createContext<SubTaskScope | null>(null);

const taskOf = (m: DistriChatMessage) => (m as { taskId?: string }).taskId;

/** The child tasks a tool call started (`TaskState.parentToolCallId`). */
export function tasksOfCall(tasks: Map<string, TaskState>, toolCallId: string): TaskState[] {
  return Array.from(tasks.values()).filter(t => t.parentToolCallId === toolCallId);
}

/**
 * Message ids of tasks nested under a tool call that `messages` shows: those
 * render inside their card, not in the flat list.
 */
export function nestedTaskIds(messages: DistriChatMessage[], tasks: Map<string, TaskState>): Set<string> {
  const calls = new Set<string>();
  for (const m of messages) {
    const e = m as { type?: string; data?: { tool_calls?: { tool_call_id: string }[] } };
    if (e.type === 'tool_calls') for (const c of e.data?.tool_calls ?? []) calls.add(c.tool_call_id);
  }
  const ids = new Set<string>();
  tasks.forEach(t => {
    if (t.parentTaskId && t.parentToolCallId && calls.has(t.parentToolCallId)) ids.add(t.id);
  });
  return ids;
}

export interface SubTaskCardProps {
  task: TaskState;
  store: ChatStore;
  rendering?: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
}

/**
 * A sub-agent's run nested under the tool call that started it: its status,
 * and its own messages and tool calls (drawn like the parent's). Open while
 * it runs; folded once it is done.
 */
export function SubTaskCard({ task, store, rendering = 'minimal', toolRenderers }: SubTaskCardProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scope = useContext(SubTaskContext);
  const toolCalls = useStore(store, s => s.toolCalls) as Map<string, ToolCallState>;
  const externalTools = useStore(store, s => s.externalTools) ?? NO_TOOLS;
  const [open, setOpen] = useState<boolean | null>(null);
  const running = task.status === 'running' || task.status === 'pending';
  const expanded = open ?? running;
  const messages = (scope?.messages ?? store.getState().messages).filter(m => taskOf(m) === task.id);
  const call = task.parentToolCallId ? toolCalls.get(task.parentToolCallId) : undefined;
  const about = call?.input?.description ?? call?.input?.title;
  const title = task.title && task.title !== 'Agent Run'
    ? task.title
    : typeof about === 'string' ? about : call?.tool_name ?? 'Sub-agent';

  return (
    <View style={styles.card} accessibilityLabel={`Sub-agent ${task.id} ${task.status}`}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!expanded)} style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.status}>{task.status}{messages.length ? ` · ${messages.length} steps` : ''} {expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {task.error && <Text accessibilityRole="alert" style={styles.error}>{task.error}</Text>}
      {expanded && messages.map((m, i) => (
        <MessageRenderer
          key={(m as { id?: string }).id ?? `${task.id}-${i}`}
          message={m}
          store={store}
          toolCalls={toolCalls}
          externalTools={externalTools}
          rendering={rendering}
          toolRenderers={toolRenderers}
        />
      ))}
    </View>
  );
}

const NO_TOOLS: NonNullable<ReturnType<ChatStore['getState']>['externalTools']> = [];

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    card: { borderLeftWidth: 2, borderLeftColor: theme.colors.accent, paddingLeft: 10, marginTop: 6, gap: 6 },
    heading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    title: { color: theme.colors.text, fontWeight: '600', fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    status: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    error: { color: theme.colors.danger, fontSize: theme.fontSizes.small },
  });
}
