import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DistriThread } from '@distri/core';
import { useThreads, UseThreadsOptions } from './useThreads';
import { DistriNativeTheme, useDistriTheme } from './theme';

export interface ThreadPickerProps extends UseThreadsOptions {
  currentThreadId: string;
  onSelect: (threadId: string) => void;
  /** Starts a fresh conversation; the app decides the new thread id. */
  onNewThread: () => void;
  /** Label for the current thread when it has no server-side title yet. */
  fallbackTitle?: string;
}

/** A dropdown of the user's conversations with a "New conversation" entry. */
export function ThreadPicker({ currentThreadId, onSelect, onNewThread, fallbackTitle = 'New conversation', ...query }: ThreadPickerProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const { threads, loading } = useThreads({ ...query, enabled: open });
  const current = threads.find(thread => thread.id === currentThreadId);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose conversation"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text style={styles.triggerText} numberOfLines={1}>{current?.title || fallbackTitle}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close conversations" style={styles.scrim} onPress={() => setOpen(false)}>
          <View style={styles.panel} onStartShouldSetResponder={() => true}>
            <Text style={styles.heading}>Conversations</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New conversation"
              onPress={() => choose(onNewThread)}
              style={({ pressed }) => [styles.row, styles.newRow, pressed && styles.pressed]}
            >
              <Text style={styles.newText}>+  New conversation</Text>
            </Pressable>
            {loading && threads.length === 0 ? <ActivityIndicator style={styles.spinner} color={theme.colors.accent} /> : (
              <FlatList
                data={threads}
                keyExtractor={(thread: DistriThread) => thread.id}
                style={styles.list}
                renderItem={({ item }: { item: DistriThread }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.title || 'conversation'}`}
                    accessibilityState={{ selected: item.id === currentThreadId }}
                    onPress={() => choose(() => onSelect(item.id))}
                    style={({ pressed }) => [styles.row, item.id === currentThreadId && styles.rowSelected, pressed && styles.pressed]}
                  >
                    <Text style={styles.rowTitle} numberOfLines={1}>{item.title || 'Untitled conversation'}</Text>
                    {item.last_message ? <Text style={styles.rowMeta} numberOfLines={1}>{item.last_message}</Text> : null}
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No earlier conversations yet.</Text>}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 240, minHeight: 36, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    triggerText: { flexShrink: 1, color: theme.colors.text, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body, fontWeight: '600' },
    chevron: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small },
    pressed: { opacity: 0.8 },
    scrim: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(17,17,17,0.35)' },
    panel: { maxHeight: '75%', borderRadius: theme.radii.card + 4, padding: 12, gap: 6, backgroundColor: theme.colors.surface },
    heading: { paddingHorizontal: 6, paddingBottom: 4, color: theme.colors.text, fontSize: theme.fontSizes.heading, fontFamily: theme.fonts.heading ?? theme.fonts.body, fontWeight: '700' },
    list: { flexGrow: 0 },
    row: { minHeight: 52, justifyContent: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme.radii.card },
    rowSelected: { backgroundColor: theme.colors.codeBackground },
    newRow: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border },
    newText: { color: theme.colors.accent, fontSize: theme.fontSizes.body, fontFamily: theme.fonts.body, fontWeight: '700' },
    rowTitle: { color: theme.colors.text, fontSize: theme.fontSizes.body, fontFamily: theme.fonts.body, fontWeight: '600' },
    rowMeta: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    empty: { padding: 12, color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    spinner: { marginVertical: 16 },
  });
}
