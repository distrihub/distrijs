import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

/**
 * Tiptap-backed composer — the same editor @distri/react's ChatInput uses, so
 * both SDKs get identical editing behaviour (and there's one obvious place to
 * add slash-commands / mentions later).
 *
 * Enter sends, Shift+Enter inserts a newline.
 */
@Component({
  selector: 'distri-chat-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-end gap-2 border-t border-border p-2">
      <div
        #host
        class="distri-editor min-w-0 flex-1 cursor-text rounded-lg border border-input bg-background
               px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring"
        [class.pointer-events-none]="disabled()"
        [class.opacity-50]="disabled()"
      ></div>

      <button
        type="button"
        (click)="submit()"
        [disabled]="disabled() || empty()"
        class="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground
               transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </div>
  `,
})
export class ChatInputComponent implements AfterViewInit, OnDestroy {
  readonly disabled = input(false);
  readonly placeholder = input('Message the agent…');
  @Output() readonly send = new EventEmitter<string>();

  @ViewChild('host') private host?: ElementRef<HTMLDivElement>;

  private editor?: Editor;
  readonly empty = signal(true);

  constructor() {
    // Tiptap owns its own editable flag; mirror `disabled` into it so the
    // caret disappears while the agent is streaming.
    effect(() => {
      const disabled = this.disabled();
      this.editor?.setEditable(!disabled);
    });
  }

  ngAfterViewInit(): void {
    if (!this.host) return;

    this.editor = new Editor({
      element: this.host.nativeElement,
      extensions: [
        // A chat composer isn't a document editor: no headings/lists/quotes.
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        Placeholder.configure({ placeholder: () => this.placeholder() }),
      ],
      editable: !this.disabled(),
      editorProps: {
        handleKeyDown: (_view, event) => {
          if (event.key !== 'Enter' || event.shiftKey) return false;
          event.preventDefault();
          this.submit();
          return true; // swallow it — Enter sends, it does not insert a newline
        },
      },
      // `untracked`: setEditable() (called from the effect below) makes Tiptap
      // emit an update synchronously, so this would otherwise be a signal
      // write inside an effect — NG0600.
      onUpdate: ({ editor }) => untracked(() => this.empty.set(editor.isEmpty)),
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  submit(): void {
    if (this.disabled()) return;
    const text = this.editor?.getText().trim() ?? '';
    if (!text) return;
    this.send.emit(text);
    this.editor?.commands.clearContent();
    this.empty.set(true);
  }
}
