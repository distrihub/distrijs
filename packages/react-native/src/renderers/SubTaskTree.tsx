import { StyleSheet, Text, View } from 'react-native';
import type { DistriChatMessage } from '@distri/core';
import type { ChatStore, TaskState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { ChatMessageList } from '../ChatMessageList';

export interface SubTaskTreeProps {
  tasks: Map<string, TaskState>;
  rootTaskId?: string | null;
  messages?: DistriChatMessage[];
  store?: ChatStore;
  rendering?: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
}

export function SubTaskTree({ tasks, rootTaskId, messages = [], store, rendering = 'minimal', toolRenderers }: SubTaskTreeProps) {
  const roots = rootTaskId
    ? [tasks.get(rootTaskId)].filter((task): task is TaskState => Boolean(task))
    : Array.from(tasks.values()).filter(task => !task.parentTaskId);

  const renderTask = (task: TaskState, depth: number): React.ReactNode => (
    <View key={task.id} style={[styles.row, { marginLeft: depth * 14 }]}>
      <View style={styles.line} />
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>{task.title || task.id}</Text>
          <Text style={styles.status}>{task.status}</Text>
        </View>
        {task.error && <Text accessibilityRole="alert" style={styles.error}>{task.error}</Text>}
        {task.parentTaskId && store && messages.some(message => (message as { taskId?: string }).taskId === task.id) && (
          <ChatMessageList
            messages={messages.filter(message => (message as { taskId?: string }).taskId === task.id)}
            store={store}
            rendering={rendering}
            toolRenderers={toolRenderers}
          />
        )}
        {task.childTaskIds.map(id => {
          const child = tasks.get(id);
          return child ? renderTask(child, depth + 1) : null;
        })}
      </View>
    </View>
  );

  if (roots.length === 0) return null;
  return <View accessibilityLabel="Subtask progress" style={styles.tree}>{roots.map(task => renderTask(task, 0))}</View>;
}

const styles = StyleSheet.create({
  tree: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 8 },
  line: { width: 3, borderRadius: 2, backgroundColor: '#99f6e4' },
  content: { flex: 1, gap: 6 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  status: { color: '#0f766e', fontSize: 12, textTransform: 'capitalize' },
  error: { color: '#b91c1c', fontSize: 12 },
});
