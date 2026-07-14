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
import type { ToolCallState } from '@distri/state';
import { ChatService, createChatService } from '../chat';
import { resolveAgentOnce } from '../agent';
import { DISTRI_SERVICE } from '../provider';
import { MessageListComponent } from './message-list.component';
import { ChatInputComponent } from './chat-input.component';
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
  imports: [MessageListComponent, ChatInputComponent, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- h-full + min-h-0 on every flex level: that's what makes the transcript
         scroll internally instead of growing and shoving the composer away. -->
    <div class="flex h-full min-h-0 flex-col bg-background text-foreground">
      <!-- Header: agent identity + start a fresh thread. -->
      <div class="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                [class]="ready() ? 'bg-primary' : 'bg-muted-foreground'"></span>
          <span class="truncate font-mono text-xs text-muted-foreground">{{ agentLabel() }}</span>
        </div>
        <button
          type="button"
          (click)="newThread()"
          class="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs
                 font-medium text-muted-foreground transition-colors
                 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
          title="Start a new conversation"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>
      </div>

      @if (errorMessage(); as err) {
        <div
          class="flex flex-col gap-0.5 border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          <strong>{{ authFailed() ? 'Authentication failed' : 'Error' }}</strong>
          <span class="break-words opacity-90">{{ err }}</span>
        </div>
      } @else if (isConnecting()) {
        <div class="px-3 py-2 text-xs text-muted-foreground">Connecting to Distri…</div>
      }

      @if (showStarters()) {
        <div class="flex flex-col items-start gap-1.5 p-3">
          <div class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Try one</div>
          @for (prompt of starterPrompts; track prompt) {
            <button
              type="button"
              (click)="onSend(prompt)"
              class="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-xs
                     leading-relaxed transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              {{ prompt }}
            </button>
          }
        </div>
      }

      <distri-message-list
        class="flex min-h-0 flex-1 flex-col"
        [messages]="messages()"
        [toolCalls]="toolCalls()"
      />

      <distri-typing-indicator [visible]="isStreaming()" />
      <distri-chat-input [disabled]="isStreaming() || !ready()" (send)="onSend($event)" />
    </div>
  `,
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
  /** All tool calls (not just pending) — the transcript renders them inline,
   *  in the position where they happened. */
  readonly toolCalls = computed(() => this.chat()?.toolCalls() ?? new Map<string, ToolCallState>());
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

  readonly agentLabel = computed(() => {
    const agent = this.agentInput();
    if (!agent) return '';
    return typeof agent === 'string' ? agent : agent.name;
  });

  /**
   * Start a fresh conversation. Swapping the thread id re-runs the connect
   * effect, which builds a brand-new chat store — so the transcript, tool
   * calls and streaming flags all reset by construction.
   */
  newThread(): void {
    const base = (this.threadId ?? 'thread').replace(/-\d+$/, '');
    this.threadInput.set(`${base}-${Date.now()}`);
  }

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
