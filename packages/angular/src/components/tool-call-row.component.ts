import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ToolCallState } from '@distri/state';

/**
 * Minimal, non-styled-per-tool display: name, status, and the raw
 * input/result as formatted JSON. This is deliberately NOT a port of
 * @distri/react's rich per-tool cards (diff viewer, HTTP tool card, approval
 * cards, …) — those stay React-only for now. Good enough to see what a tool
 * call did; not a polished per-tool experience.
 */
@Component({
  selector: 'distri-tool-call-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="distri-tool-call" [attr.data-status]="toolCall?.status">
      <div class="distri-tool-call__header">
        <span class="distri-tool-call__name">{{ toolCall?.tool_name }}</span>
        <span class="distri-tool-call__status">{{ toolCall?.status }}</span>
      </div>
      @if (toolCall?.input && hasKeys(toolCall!.input)) {
        <pre class="distri-tool-call__block">{{ format(toolCall!.input) }}</pre>
      }
      @if (toolCall?.error) {
        <pre class="distri-tool-call__block distri-tool-call__block--error">{{ toolCall!.error }}</pre>
      }
    </div>
  `,
  styles: [`
    .distri-tool-call {
      border: 1px solid rgba(127, 127, 127, 0.3);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      margin: 4px 0;
    }
    .distri-tool-call__header {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-weight: 600;
    }
    .distri-tool-call__status {
      font-weight: 400;
      opacity: 0.65;
      text-transform: capitalize;
    }
    .distri-tool-call__block {
      margin: 6px 0 0;
      padding: 6px 8px;
      background: rgba(127, 127, 127, 0.12);
      border-radius: 4px;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .distri-tool-call__block--error {
      background: rgba(220, 38, 38, 0.12);
      color: #dc2626;
    }
  `],
})
export class ToolCallRowComponent {
  @Input() toolCall: ToolCallState | null = null;

  hasKeys(obj: Record<string, unknown>): boolean {
    return Object.keys(obj ?? {}).length > 0;
  }

  format(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}
