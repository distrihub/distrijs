import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'distri-typing-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="distri-typing" role="status" aria-label="Assistant is responding">
        <span class="distri-typing__dot"></span>
        <span class="distri-typing__dot"></span>
        <span class="distri-typing__dot"></span>
      </div>
    }
  `,
  styles: [`
    .distri-typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0;
    }
    .distri-typing__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.4;
      animation: distri-typing-pulse 1s infinite ease-in-out;
    }
    .distri-typing__dot:nth-child(2) { animation-delay: 0.15s; }
    .distri-typing__dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes distri-typing-pulse {
      0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
      40% { opacity: 1; transform: scale(1); }
    }
  `],
})
export class TypingIndicatorComponent {
  @Input() visible = false;
}
