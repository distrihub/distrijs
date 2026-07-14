import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { AgentDefinition, DistriBaseTool, DistriClient, DistriMessage } from '@distri/core';
import { ChatService, createChatService } from '../chat';
import { resolveAgentOnce } from '../agent';
import { DISTRI_SERVICE } from '../provider';
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
      @if (errorMessage(); as err) {
        <div class="distri-chat__error" role="alert">
          <strong>{{ authFailed() ? 'Authentication failed' : 'Error' }}</strong>
          <span>{{ err }}</span>
        </div>
      } @else if (isConnecting()) {
        <div class="distri-chat__status">Connecting to Distri…</div>
      }
      @if (showStarters()) {
        <div class="distri-chat__starters">
          <div class="distri-chat__starters-label">Try one:</div>
          @for (prompt of starterPrompts; track prompt) {
            <button type="button" class="distri-chat__starter" (click)="onSend(prompt)">
              {{ prompt }}
            </button>
          }
        </div>
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
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 12px;
      background: rgba(220, 38, 38, 0.12);
      border-left: 3px solid #dc2626;
      color: #dc2626;
      font-size: 13px;
      word-break: break-word;
    }
    .distri-chat__status {
      padding: 10px 12px;
      font-size: 13px;
      opacity: 0.7;
    }
    .distri-chat__pending-tools {
      padding: 0 8px;
    }
    .distri-chat__starters {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 12px;
    }
    .distri-chat__starters-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.55;
    }
    .distri-chat__starter {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid rgba(127, 127, 127, 0.35);
      border-radius: 8px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 13px;
      line-height: 1.45;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .distri-chat__starter:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.5);
    }
  `],
})
export class DistriChatComponent implements OnChanges, OnDestroy {
  /**
   * Optional. By default the client comes from DI (`provideDistri(...)`), the
   * same way `@distri/react`'s components read it from `<DistriProvider>`.
   * Pass one explicitly only to override that.
   */
  @Input() client?: DistriClient;
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
  /**
   * Example prompts shown as clickable buttons while the chat is empty, so a
   * first-time user can see what the agent can do without having to think of
   * something to type. Clicking one sends it.
   */
  @Input() starterPrompts?: string[];

  private readonly distri = inject(DISTRI_SERVICE, { optional: true });

  /** Inputs mirrored into signals so `effect()` below can react to them. */
  private readonly clientInput = signal<DistriClient | null>(null);
  private readonly agentInput = signal<string | AgentDefinition | null>(null);
  private readonly threadInput = signal<string | null>(null);

  /** Explicit `[client]` wins; otherwise take the one from `provideDistri`. */
  private readonly activeClient = computed(
    () => this.clientInput() ?? this.distri?.client() ?? null,
  );

  private chat = signal<ChatService | null>(null);
  private agentError = signal<Error | null>(null);

  readonly messages = computed(() => this.chat()?.messages() ?? []);
  readonly isStreaming = computed(() => this.chat()?.isStreaming() ?? false);
  readonly ready = computed(() => this.chat() !== null);
  /** Starters are an empty-state affordance: only while there's nothing to show. */
  readonly showStarters = computed(
    () => !!this.starterPrompts?.length && this.ready() && this.messages().length === 0,
  );
  readonly pendingToolCalls = computed(() => {
    const tcs = this.chat()?.toolCalls();
    if (!tcs) return [];
    return Array.from(tcs.values()).filter((tc) => tc.status === 'pending' || tc.status === 'running');
  });
  /** Auth/config failed in `provideDistri` — there is no client, so nothing works. */
  readonly authFailed = computed(() => this.distri?.error() != null);
  /** Waiting on `provideDistri`'s config (e.g. a token fetch) to resolve. */
  readonly isConnecting = computed(
    () => !this.ready() && !this.authFailed() && (this.distri?.isLoading() ?? false),
  );
  readonly errorMessage = computed(() => {
    // Auth failure first: without a client, agent/chat errors are just noise.
    const err = this.distri?.error() ?? this.chat()?.error() ?? this.agentError() ?? null;
    return err?.message ?? null;
  });

  constructor() {
    // Reconnect whenever the client (which may arrive asynchronously, once
    // provideDistri's token fetch resolves), the agent, or the thread changes.
    // `allowSignalWrites`: this effect intentionally drives the chat/error
    // signals — that IS its job, not an accidental write during computation.
    effect(() => {
      // These three are the ONLY dependencies this effect should have.
      const client = this.activeClient();
      const agentIdOrDef = this.agentInput();
      const threadId = this.threadInput();

      // `untracked`: the effect also *writes* `chat`, so reading it in the
      // tracking context would make the effect depend on its own output and
      // re-run forever — which hammered /v1/agents until the API 429'd.
      untracked(() => {
        this.chat()?.dispose();
        this.chat.set(null);
        this.agentError.set(null);
      });

      if (!client || !agentIdOrDef || !threadId) return;

      resolveAgentOnce(client, agentIdOrDef)
        .then((agent) => {
          untracked(() => {
            // Bail if a newer run superseded this one while it was in flight.
            if (
              this.activeClient() !== client ||
              this.agentInput() !== agentIdOrDef ||
              this.threadInput() !== threadId
            ) {
              return;
            }
            this.chat.set(
              createChatService({
                agent,
                threadId,
                externalTools: this.externalTools,
                beforeSendMessage: this.beforeSendMessage,
              }),
            );
          });
        })
        .catch((err) => {
          untracked(() =>
            this.agentError.set(err instanceof Error ? err : new Error('Failed to initialize agent')),
          );
        });
    }, { allowSignalWrites: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client']) this.clientInput.set(this.client ?? null);
    if (changes['agentIdOrDef']) this.agentInput.set(this.agentIdOrDef ?? null);
    if (changes['threadId']) this.threadInput.set(this.threadId ?? null);
  }

  ngOnDestroy(): void {
    this.chat()?.dispose();
  }

  onSend(text: string): void {
    void this.chat()?.sendMessage(text);
  }
}
