import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { getToolSummary, type ToolCallState } from '@distri/state';

function pretty(value: unknown): string {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * One tool call, rendered the way @distri/react's MinimalToolRow does: a
 * wrench, the tool's human summary (via the shared `getToolSummary`), the
 * headline argument as a chip, and a live status indicator.
 */
@Component({
  selector: 'distri-tool-call-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toolCall(); as tc) {
      <div class="animate-distri-fade-in rounded-md border border-border bg-muted/40 text-xs">
      <button
        type="button"
        (click)="expanded.set(!expanded())"
        class="flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70"
        [attr.aria-expanded]="expanded()"
      >
        <span class="mt-px shrink-0 text-muted-foreground">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-medium text-foreground">{{ summary().verb }}</span>
            @if (summary().subject; as subject) {
              <code class="truncate rounded bg-background/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {{ subject }}
              </code>
            }
            @if (summary().detail; as detail) {
              <span class="text-muted-foreground">{{ detail }}</span>
            }
          </div>

          @if (tc.error) {
            <div class="mt-1 break-words text-destructive">{{ tc.error }}</div>
          }
        </div>

        <!-- chevron: rotates when open -->
        <span
          class="mt-0.5 shrink-0 text-muted-foreground transition-transform"
          [class.rotate-90]="expanded()"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>

        <span class="mt-0.5 shrink-0" [title]="tc.status">
          @switch (tc.status) {
            @case ('completed') {
              <svg class="text-primary" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
            @case ('error') {
              <svg class="text-destructive" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="3" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            }
            @default {
              <span class="block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
            }
          }
        </span>
      </button>

      @if (expanded()) {
        <div class="animate-distri-fade-in space-y-2 border-t border-border px-2.5 py-2">
          <div>
            <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
            <pre class="distri-scroll max-h-40 overflow-auto whitespace-pre-wrap break-words rounded
                        bg-background/70 p-2 font-mono text-[11px] leading-relaxed">{{ inputJson() }}</pre>
          </div>
          @if (resultJson(); as result) {
            <div>
              <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Result</div>
              <pre class="distri-scroll max-h-40 overflow-auto whitespace-pre-wrap break-words rounded
                          bg-background/70 p-2 font-mono text-[11px] leading-relaxed">{{ result }}</pre>
            </div>
          }
        </div>
      }
      </div>
    }
  `,
})
export class ToolCallRowComponent {
  readonly toolCall = input<ToolCallState | null>(null);

  /** Click the row to reveal the raw input/result. Collapsed by default. */
  readonly expanded = signal(false);

  /** Same summariser the React renderers use, so both frameworks phrase calls identically. */
  readonly summary = computed(() => {
    const tc = this.toolCall();
    if (!tc) return { verb: '', subject: undefined, detail: undefined };
    return getToolSummary(tc.tool_name, tc.input ?? {}, tc.result);
  });

  readonly inputJson = computed(() => pretty(this.toolCall()?.input ?? {}));

  readonly resultJson = computed(() => {
    const result = this.toolCall()?.result;
    if (!result) return null;
    // Tool results carry their payload in parts; show the data/text rather
    // than the A2A envelope, which is noise to a human reader.
    const parts = (result.parts ?? []) as Array<{ part_type?: string; data?: unknown }>;
    const payload = parts.map((p) => p.data ?? p).filter((d) => d != null);
    return pretty(payload.length === 1 ? payload[0] : payload.length ? payload : result);
  });
}
