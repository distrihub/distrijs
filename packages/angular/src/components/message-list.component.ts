import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  input,
} from '@angular/core';
import { isDistriEvent, isDistriMessage, type DistriChatMessage, type DistriMessage } from '@distri/core';
import type { ToolCallState } from '@distri/state';
import { ToolCallRowComponent } from './tool-call-row.component';

interface TextItem {
  kind: 'text';
  id: string;
  role: string;
  text: string;
}
interface ToolItem {
  kind: 'tool';
  id: string;
  call: ToolCallState;
}
type TimelineItem = TextItem | ToolItem;

/** Pull the text out of a DistriMessage's parts (ignores non-text parts). */
function textOf(m: DistriMessage): string {
  return (m.parts ?? [])
    .filter((p) => (p as { part_type?: string }).part_type === 'text')
    .map((p) => String((p as { data?: unknown }).data ?? ''))
    .join('');
}

/**
 * The chat transcript. Builds a timeline in arrival order — text bubbles plus
 * a row per tool call — instead of dumping raw event JSON.
 *
 * Owns its own scrolling (`overflow-y-auto` + `min-h-0`). Without `min-h-0` a
 * flex child refuses to shrink below its content, so the list just grows and
 * shoves the composer off the bottom of the page instead of scrolling.
 */
@Component({
  selector: 'distri-message-list',
  standalone: true,
  imports: [ToolCallRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #scroller class="distri-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3">
      @for (item of items(); track item.id) {
        @if (item.kind === 'text') {
          <div
            class="animate-distri-fade-in flex flex-col gap-1"
            [class.items-end]="item.role === 'user'"
            [class.items-start]="item.role !== 'user'"
          >
            <span class="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {{ item.role }}
            </span>
            <div
              class="max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm"
              [class]="
                item.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              "
            >{{ item.text }}</div>
          </div>
        } @else {
          <distri-tool-call-row [toolCall]="item.call" />
        }
      }
    </div>
  `,
})
export class MessageListComponent implements AfterViewChecked {
  readonly messages = input<DistriChatMessage[]>([]);
  /** Live tool-call state, so a row's status updates after the event that spawned it. */
  readonly toolCalls = input<Map<string, ToolCallState>>(new Map());

  @ViewChild('scroller') private scroller?: ElementRef<HTMLDivElement>;
  private lastSignature = '';

  readonly items = computed<TimelineItem[]>(() => {
    const calls = this.toolCalls();
    const out: TimelineItem[] = [];
    const seenTool = new Set<string>();

    this.messages().forEach((m, i) => {
      // Text from the user / assistant (streams in place as deltas arrive).
      if (isDistriMessage(m)) {
        const text = textOf(m).trim();
        if (text) out.push({ kind: 'text', id: m.id || `m-${i}`, role: m.role, text });
        return;
      }

      // Tool calls become rows, positioned where they actually happened.
      // Everything else (run_started, budget updates, …) is bookkeeping the
      // user doesn't need to read — dropping it is the whole point.
      if (isDistriEvent(m) && m.type === 'tool_calls') {
        const data = (m as { data?: { tool_calls?: Array<{ tool_call_id: string }> } }).data;
        for (const raw of data?.tool_calls ?? []) {
          const id = raw.tool_call_id;
          if (!id || seenTool.has(id)) continue;
          seenTool.add(id);
          const call = calls.get(id);
          if (call) out.push({ kind: 'tool', id, call });
        }
      }
    });

    return out;
  });

  /** Keep the newest content in view as the agent streams. */
  ngAfterViewChecked(): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    // Cheap change detector: item count + the last item's text length, so
    // streaming deltas (which mutate the last bubble) also pin to the bottom.
    const list = this.items();
    const last = list[list.length - 1];
    const signature = `${list.length}:${last?.kind === 'text' ? last.text.length : last?.call.status ?? ''}`;
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    el.scrollTop = el.scrollHeight;
  }
}
