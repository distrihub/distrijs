import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  createFailedToolResult,
  createSuccessfulToolResult,
  ToolCall,
  ToolResult,
  ToolHandler,
} from '@distri/core';
import type { DistriBaseTool } from '@distri/core';
import type { ChatStore, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, NativeUiTool, RenderingMode } from '../types';
import { DistriNativeTheme, useDistriTheme } from '../theme';

interface ToolExecutionRendererProps {
  toolCalls: ToolCall[];
  states: Map<string, ToolCallState>;
  tools: DistriBaseTool[];
  store: ChatStore;
  renderers?: NativeToolRendererMap;
  rendering: RenderingMode;
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function ToolCard({ call, state, tool, store, rendering }: {
  call: ToolCall;
  state?: ToolCallState;
  tool?: DistriBaseTool;
  store: ChatStore;
  rendering: RenderingMode;
}) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);
  const status = state?.status ?? 'pending';
  const handler = tool?.type === 'function' ? (tool as DistriBaseTool & { handler?: ToolHandler }).handler : undefined;
  const needsApproval = Boolean(handler && !(tool as { autoExecute?: boolean }).autoExecute && status !== 'completed' && status !== 'error');

  const complete = async (result: ToolResult) => {
    setBusy(true);
    store.getState().updateToolCallStatus(call.tool_call_id, { status: 'running' });
    await store.getState().completeTool(call, result);
    setBusy(false);
  };

  const approve = async () => {
    if (!handler) return;
    setBusy(true);
    try {
      const result = await handler(call.input);
      await complete(createSuccessfulToolResult(call.tool_call_id, call.tool_name, result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await complete(createFailedToolResult(call.tool_call_id, call.tool_name, message, 'Client tool failed'));
    } finally {
      setBusy(false);
    }
  };

  const deny = () => complete(createSuccessfulToolResult(call.tool_call_id, call.tool_name, { approved: false }));
  const result = state?.result;

  return (
    <View style={[styles.card, theme.styles.toolCard]} accessibilityLabel={`Tool ${call.tool_name} ${status}`}>
      <View style={styles.header}>
        <Text style={styles.title}>{call.tool_name}</Text>
        <Text style={styles.status}>{status.replace(/_/g, ' ')}</Text>
      </View>
      {rendering === 'rich' && <Text style={styles.detail}>{displayValue(call.input)}</Text>}
      {state?.error && <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>}
      {result && <Text style={styles.detail}>{displayValue(result.parts)}</Text>}
      {needsApproval && (
        <View style={styles.actions}>
          <Pressable accessibilityLabel={`Approve ${call.tool_name}`} disabled={busy} onPress={approve} style={styles.approve}>
            <Text style={styles.approveText}>{busy ? 'Running…' : 'Run'}</Text>
          </Pressable>
          <Pressable accessibilityLabel={`Deny ${call.tool_name}`} disabled={busy} onPress={deny} style={styles.deny}>
            <Text style={styles.denyText}>Decline</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function ToolExecutionRenderer({ toolCalls, states, tools, store, renderers, rendering }: ToolExecutionRendererProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.list}>
      {toolCalls.map(call => {
        const state = states.get(call.tool_call_id);
        const tool = tools.find(candidate => candidate.name === call.tool_name);
        const completeTool = (result: ToolResult) => { void store.getState().completeTool(call, result); };
        const custom = renderers?.[call.tool_name];
        if (custom) return <View key={call.tool_call_id}>{custom({ toolCall: call, state, completeTool })}</View>;
        if (state?.component) return <View key={call.tool_call_id}>{state.component as React.ReactNode}</View>;
        if (tool?.type === 'ui') {
          const UiComponent = (tool as NativeUiTool).component;
          return <UiComponent key={call.tool_call_id} tool={tool} toolCall={call} toolCallState={state} completeTool={completeTool} />;
        }
        return <ToolCard key={call.tool_call_id} call={call} state={state} tool={tool} store={store} rendering={rendering} />;
      })}
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    list: { gap: 8 },
    card: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.card, backgroundColor: theme.colors.surface, padding: 12, gap: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    title: { color: theme.colors.text, fontWeight: '700', fontSize: 14, fontFamily: theme.fonts.body },
    status: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, textTransform: 'capitalize', fontFamily: theme.fonts.body },
    detail: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, lineHeight: 18, fontFamily: theme.fonts.body },
    error: { color: theme.colors.danger, fontSize: 13 },
    actions: { flexDirection: 'row', gap: 8 },
    approve: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.button, paddingHorizontal: 12, paddingVertical: 8 },
    approveText: { color: theme.colors.onPrimary, fontWeight: '600' },
    deny: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.button, paddingHorizontal: 12, paddingVertical: 8 },
    denyText: { color: theme.colors.text, fontWeight: '600' },
  });
}
