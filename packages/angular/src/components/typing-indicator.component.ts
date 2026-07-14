import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Streaming/thinking indicator, mirroring @distri/react's: a shimmering label
 * plus three bouncing dots, so the user can tell the agent is working rather
 * than stalled.
 */
@Component({
  selector: 'distri-typing-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="flex shrink-0 items-center gap-2 px-3 py-2"
        role="status"
        aria-label="Assistant is responding"
      >
        <span class="animate-pulse text-xs font-medium text-muted-foreground">{{ label() }}</span>
        <span class="flex items-center gap-1">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"></span>
        </span>
      </div>
    }
  `,
})
export class TypingIndicatorComponent {
  readonly visible = input(false);
  readonly label = input('Thinking');
}
