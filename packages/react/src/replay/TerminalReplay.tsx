import { useMemo } from 'react';
import type { Cassette } from './types';

/**
 * Projects a cassette into terminal lines instead of chat messages — the same
 * clock (`useReplay`'s `t`/`seek`) drives this as `replayStateAt` drives
 * `ReplayChat`, just with a different, cassette-agnostic renderer. Pure
 * function of `(cassette, t)`, same determinism guarantee as `replayStateAt`.
 */
export function terminalLinesAt(cassette: Cassette, t: number): string[] {
  const lines: string[] = [];
  let current = '';

  const flush = () => {
    if (current) {
      lines.push(current);
      current = '';
    }
  };

  for (const event of cassette.events) {
    if (event.t > t) break;

    switch (event.kind) {
      case 'user_message':
        flush();
        lines.push(`$ ${event.text}`);
        break;
      case 'text_delta':
        current += event.text;
        break;
      case 'tool_call':
        flush();
        lines.push(`+ running ${event.name}...`);
        break;
      case 'tool_result':
        flush();
        lines.push(event.error ? `✗ ${event.error}` : event.result);
        break;
      case 'user_tool_input':
        flush();
        lines.push(`> ${event.response}`);
        break;
      case 'reasoning_delta':
      case 'ui_mutation':
      case 'task_summary':
      case 'workflow_step':
      case 'done':
        break;
    }
  }
  flush();

  return lines;
}

export interface TerminalReplayProps {
  cassette: Cassette;
  t: number;
  isStreaming: boolean;
  className?: string;
}

/** Renders a recorded run as a styled `<pre>` terminal instead of a chat transcript. */
export function TerminalReplay({ cassette, t, isStreaming, className }: TerminalReplayProps) {
  const lines = useMemo(() => terminalLinesAt(cassette, t), [cassette, t]);

  return (
    <pre
      className={className}
      style={{
        margin: 0,
        height: '100%',
        overflowY: 'auto',
        background: '#0a0c0f',
        color: '#c8f5d0',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.6,
        padding: 16,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
      {isStreaming && <span style={{ opacity: 0.8 }}>▋</span>}
    </pre>
  );
}
