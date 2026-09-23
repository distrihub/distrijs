import { Image, StyleSheet, Text } from 'react-native';
import type { DistriPart } from '@distri/core';
import type { ChatStore, ToolCallState } from '@distri/state';
import type { NativeToolRendererMap, RenderingMode } from '../types';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';

export interface DistriPartRendererProps {
  part: DistriPart;
  isUser: boolean;
  toolCalls: Map<string, ToolCallState>;
  externalTools: NonNullable<ReturnType<ChatStore['getState']>['externalTools']>;
  store: ChatStore;
  rendering: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function imageUri(data: { type?: string; mime_type?: string; bytes?: string; url?: string }): string | undefined {
  if (data.type === 'url') return data.url;
  if (data.type === 'bytes' && data.bytes) return `data:${data.mime_type || 'image/png'};base64,${data.bytes}`;
  return undefined;
}

export function DistriPartRenderer({ part, isUser, toolCalls, externalTools, store, rendering, toolRenderers }: DistriPartRendererProps) {
  if (part.part_type === 'text') return <Text style={[styles.text, isUser && styles.userText]}>{part.data}</Text>;
  if (part.part_type === 'image') {
    const data = part.data as { type?: string; mime_type?: string; bytes?: string; url?: string; name?: string };
    const uri = imageUri(data);
    return uri
      ? <Image accessibilityLabel={data.name || 'Message image'} source={{ uri }} resizeMode="contain" style={styles.image} />
      : <Text style={styles.fallback}>Image unavailable</Text>;
  }
  if (part.part_type === 'tool_call') {
    return <ToolExecutionRenderer toolCalls={[part.data]} states={toolCalls} tools={externalTools} store={store} renderers={toolRenderers} rendering={rendering} />;
  }
  if (part.part_type === 'tool_result') return <Text style={styles.detail}>{stringify(part.data.parts)}</Text>;
  if (part.part_type === 'file') return <Text style={styles.detail}>{(part.data as { name?: string }).name || 'File attachment'}</Text>;
  if (part.part_type === 'artifact') {
    const data = part.data;
    return <Text style={styles.detail}>{data.original_filename || data.relative_path || data.file_id || 'Artifact'}</Text>;
  }
  if (part.part_type === 'resource_link') return <Text style={styles.detail}>{part.data.text || part.data.uri}</Text>;
  return <Text style={styles.detail}>{stringify(part)}</Text>;
}

const styles = StyleSheet.create({
  text: { color: '#111827', fontSize: 15, lineHeight: 21 },
  userText: { color: '#ffffff' },
  image: { width: 240, height: 180, borderRadius: 10, backgroundColor: '#e2e8f0' },
  detail: { color: '#334155', fontSize: 12 },
  fallback: { color: '#475569', fontSize: 13, padding: 8 },
});
