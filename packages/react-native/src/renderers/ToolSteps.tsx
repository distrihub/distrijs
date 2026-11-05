import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { summarizeToolRun, toolStepLabel } from '@distri/state';
import type { ChatStore, SummaryFn, ToolCallState, TranscriptStepsBlock } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { NestedTasks, ToolExecutionRenderer } from './ToolExecutionRenderer';
import { DistriNativeTheme, useDistriTheme } from '../theme';

export interface ToolStepsProps {
  block: TranscriptStepsBlock;
  states: Map<string, ToolCallState>;
  tools: NonNullable<ReturnType<ChatStore['getState']>['externalTools']>;
  store: ChatStore;
  renderers?: NativeToolRendererMap;
  rendering: RenderingMode;
  /** Fold the calls behind one "N steps · …" row (`groupToolCalls="run"`). */
  grouped?: boolean;
  toolLabels?: Record<string, string>;
  toolSummaryOverrides?: Record<string, SummaryFn>;
}

const LIVE = new Set(['pending', 'running', 'user_action_required']);

/**
 * One transcript `steps` block. Ungrouped it is the usual tool cards; grouped
 * it is one "N steps · label, label" row that opens itself when a call fails
 * or waits for the user, so nothing actionable stays hidden.
 */
export function ToolSteps({ block, states, tools, store, renderers, rendering, grouped = false, toolLabels, toolSummaryOverrides }: ToolStepsProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const calls = block.toolCalls.map(call => states.get(call.tool_call_id));
  const failed = calls.filter(s => s?.status === 'error').length;
  const waiting = calls.some(s => s?.status === 'user_action_required');
  const running = calls.some(s => s && LIVE.has(s.status));
  const attention = failed > 0 || waiting;
  const [open, setOpen] = useState(attention);
  useEffect(() => { if (attention) setOpen(true); }, [attention]);

  const content = (
    <ToolExecutionRenderer toolCalls={block.toolCalls} states={states} tools={tools} store={store} renderers={renderers} rendering={rendering} nested={!grouped} />
  );
  if (!grouped) return content;

  const labels = block.toolCalls.map((call, i) => toolStepLabel(call, { toolLabels, summaryOverrides: toolSummaryOverrides, result: calls[i]?.result }));
  const summary = summarizeToolRun(labels) + (failed > 0 ? ` · ${failed} failed` : '');
  const marker = failed > 0 ? '✗' : running ? '…' : '✓';
  return (
    <View accessibilityLabel={`Tool steps: ${summary}`}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.heading}>
        <Text style={[styles.marker, failed > 0 && styles.markerFailed]}>{marker}</Text>
        <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open && <View style={styles.body}>{content}</View>}
      {/* A helper stays visible while its run is folded. */}
      <NestedTasks toolCalls={block.toolCalls} store={store} renderers={renderers} rendering={rendering} />
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    heading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    marker: { color: theme.colors.mutedText, width: 14, textAlign: 'center', fontSize: theme.fontSizes.small },
    markerFailed: { color: theme.colors.danger },
    summary: { flex: 1, color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
    chevron: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small },
    body: { paddingLeft: 22 },
  });
}
