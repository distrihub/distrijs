import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, input } from '@angular/core';
import { DistriChatMessage, isDistriMessage } from '@distri/core';
import { extractTextFromMessage, shouldDisplayMessage } from '@distri/state';

interface DisplayRow {
  key: string;
  role: string;
  text: string;
}

/**
 * Plain text rendering — no markdown pipeline in v1 (explicit scope cut, easy
 * follow-up). Auto-scrolls to the newest message. Deliberately basic: no
 * per-task grouping / SubTaskCards, no streaming-specific animation, just the
 * flat message log.
 */
@Component({
  selector: 'distri-message-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="distri-message-list" #scrollAnchor>
      @for (row of rows(); track row.key) {
        <div class="distri-message" [attr.data-role]="row.role">
          <div class="distri-message__role">{{ row.role }}</div>
          <div class="distri-message__text">{{ row.text }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .distri-message-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      padding: 8px;
    }
    .distri-message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(127, 127, 127, 0.1);
    }
    .distri-message[data-role="user"] {
      align-self: flex-end;
      background: rgba(59, 130, 246, 0.15);
    }
    .distri-message__role {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      opacity: 0.55;
      margin-bottom: 2px;
    }
    .distri-message__text {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
    }
  `],
})
export class MessageListComponent {
  readonly messages = input<DistriChatMessage[]>([]);

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      // Track the signal so this effect reruns on every message update.
      this.messages();
      queueMicrotask(() => {
        const el = this.scrollAnchor?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  rows(): DisplayRow[] {
    return this.messages()
      .filter((m) => shouldDisplayMessage(m))
      .map((m, i) => ({
        key: isDistriMessage(m) ? m.id : `evt-${i}`,
        role: isDistriMessage(m) ? m.role : 'event',
        text: extractTextFromMessage(m),
      }))
      .filter((row) => row.text.trim().length > 0);
  }
}
