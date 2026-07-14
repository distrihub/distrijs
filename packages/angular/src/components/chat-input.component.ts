import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'distri-chat-input',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="distri-chat-input" (submit)="onSubmit($event)">
      <textarea
        class="distri-chat-input__textarea"
        rows="2"
        [disabled]="disabled"
        [(ngModel)]="value"
        name="distri-chat-input"
        placeholder="Message the agent…"
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <button
        type="submit"
        class="distri-chat-input__send"
        [disabled]="disabled || !value.trim()"
      >
        Send
      </button>
    </form>
  `,
  styles: [`
    .distri-chat-input {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      padding: 8px;
      border-top: 1px solid rgba(127, 127, 127, 0.25);
    }
    .distri-chat-input__textarea {
      flex: 1;
      resize: none;
      border-radius: 6px;
      border: 1px solid rgba(127, 127, 127, 0.35);
      padding: 8px 10px;
      font: inherit;
      background: transparent;
      color: inherit;
    }
    .distri-chat-input__send {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      background: #3b82f6;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }
    .distri-chat-input__send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class ChatInputComponent {
  @Input() disabled = false;
  @Output() readonly send = new EventEmitter<string>();

  value = '';

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    this.submit();
  }

  private submit(): void {
    const trimmed = this.value.trim();
    if (!trimmed || this.disabled) return;
    this.send.emit(trimmed);
    this.value = '';
  }
}
