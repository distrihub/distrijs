import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges, computed, signal } from '@angular/core';
import { AgentDefinition, DistriBaseTool, DistriClient, DistriMessage } from '@distri/core';
import { ChatService, createChatService } from '../chat';
import { resolveAgentOnce } from '../agent';
import { MessageListComponent } from './message-list.component';
import { ChatInputComponent } from './chat-input.component';
import { ToolCallRowComponent } from './tool-call-row.component';
import { TypingIndicatorComponent } from './typing-indicator.component';

/**
 * Top-level basic chat UI: resolves an agent, wires up `createChatService`,
 * and composes the message list / input / tool-call rows / typing
 * indicator. Deliberately basic — this is NOT a port of @distri/react's
 * `<Chat>` (no rich tool cards, workflow progress, context indicators, voice
 * input, markdown rendering). It exists to prove Angular has a working,
 * usable chat out of the box; richer components are future work.
 */
@Component({
  selector: 'distri-chat',
  standalone: true,
  imports: [MessageListComponent, ChatInputComponent, ToolCallRowComponent, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="distri-chat">
      @if (errorMessage()) {
        <div class="distri-chat__error">{{ errorMessage() }}</div>
      }
      <distri-message-list [messages]="messages()" />
      <div class="distri-chat__pending-tools">
        @for (tc of pendingToolCalls(); track tc.tool_call_id) {
          <distri-tool-call-row [toolCall]="tc" />
        }
      </div>
      <distri-typing-indicator [visible]="isStreaming()" />
      <distri-chat-input [disabled]="isStreaming() || !ready()" (send)="onSend($event)" />
    </div>
  `,
  styles: [`
    .distri-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .distri-chat__error {
      padding: 8px 12px;
      background: rgba(220, 38, 38, 0.12);
      color: #dc2626;
      font-size: 13px;
    }
    .distri-chat__pending-tools {
      padding: 0 8px;
    }
  `],
})
export class DistriChatComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) client!: DistriClient;
  @Input({ required: true }) agentIdOrDef!: string | AgentDefinition;
  @Input({ required: true }) threadId!: string;
  /**
   * Frontend-executed tools the agent can call. Expected to be stable for
   * this component's lifetime (define once, e.g. as a class field) — unlike
   * `client`/`agentIdOrDef`/`threadId`, changing this alone does not
   * reconnect the chat.
   */
  @Input() externalTools?: DistriBaseTool[];
  /** Runs on the outgoing user message before it's sent — e.g. to inject
   *  extra context (form HTML, current grid state) the agent should see. */
  @Input() beforeSendMessage?: (message: DistriMessage) => Promise<DistriMessage>;

  private chat = signal<ChatService | null>(null);
  private agentError = signal<Error | null>(null);

  readonly messages = computed(() => this.chat()?.messages() ?? []);
  readonly isStreaming = computed(() => this.chat()?.isStreaming() ?? false);
  readonly ready = computed(() => this.chat() !== null);
  readonly pendingToolCalls = computed(() => {
    const tcs = this.chat()?.toolCalls();
    if (!tcs) return [];
    return Array.from(tcs.values()).filter((tc) => tc.status === 'pending' || tc.status === 'running');
  });
  readonly errorMessage = computed(() => {
    const err = this.chat()?.error() ?? this.agentError();
    return err?.message ?? null;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client'] || changes['agentIdOrDef'] || changes['threadId']) {
      this.reconnect();
    }
  }

  ngOnDestroy(): void {
    this.chat()?.dispose();
  }

  onSend(text: string): void {
    void this.chat()?.sendMessage(text);
  }

  private reconnect(): void {
    this.chat()?.dispose();
    this.chat.set(null);
    this.agentError.set(null);

    if (!this.client || !this.agentIdOrDef || !this.threadId) return;

    const { client, agentIdOrDef, threadId } = this;
    resolveAgentOnce(client, agentIdOrDef)
      .then((agent) => {
        // Bail if a newer `reconnect()` (from a subsequent input change)
        // already ran while this resolution was in flight.
        if (this.client !== client || this.agentIdOrDef !== agentIdOrDef || this.threadId !== threadId) return;
        this.chat.set(createChatService({
          agent,
          threadId,
          externalTools: this.externalTools,
          beforeSendMessage: this.beforeSendMessage,
        }));
      })
      .catch((err) => {
        this.agentError.set(err instanceof Error ? err : new Error('Failed to initialize agent'));
      });
  }
}
