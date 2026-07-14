import { Agent, DistriChatMessage } from '@distri/core';
import { ChatStore } from './chatStore';

const MAX_RECONNECTS = 3;

/**
 * Seed the fork task-tree from persisted history (render-only — never pumped
 * into the store as messages). Exported standalone since callers re-hydrate
 * both before the first connect and after every reconnect-triggered clear.
 */
export function hydrateFromHistory(store: ChatStore, initialMessages?: DistriChatMessage[]): void {
  if (!initialMessages || initialMessages.length === 0) return;
  const links = initialMessages
    .map((m) => ({
      taskId: (m as { taskId?: string }).taskId as string,
      parentTaskId: (m as { parentTaskId?: string }).parentTaskId,
    }))
    .filter((l) => Boolean(l.taskId));
  if (links.length > 0) store.getState().hydrateTaskTree(links);
}

export interface TaskStreamingStartOptions {
  agent: Agent;
  taskId: string;
  initialMessages?: DistriChatMessage[];
  onError?: (error: Error) => void;
  onTerminalChange?: (isTerminal: boolean) => void;
}

/**
 * Read-only follow of an existing task, extracted from `@distri/react`'s
 * `useTaskStreaming` hook. The observational twin of `ChatController`: drives
 * a chat-state store from `agent.resubscribe(taskId)` (A2A
 * `tasks/resubscribe`) instead of a `sendMessage` turn.
 *
 * (Re)connect is idempotent: `tasks/resubscribe` always replays the full
 * event log from position 0, so every connect first clears the store and
 * replays — guaranteeing consistent state with no doubled text deltas.
 */
export class TaskStreamingController {
  private abortController: AbortController | null = null;
  private cancelled = false;

  constructor(private readonly store: ChatStore) {}

  start(options: TaskStreamingStartOptions): void {
    // A fresh start supersedes anything in flight.
    this.stop();

    const { agent, taskId, initialMessages, onError, onTerminalChange } = options;
    const ac = new AbortController();
    this.abortController = ac;
    this.cancelled = false;
    onTerminalChange?.(false);

    const run = async () => {
      let attempt = 0;
      while (!this.cancelled && !ac.signal.aborted) {
        // Fresh (re)connect: resubscribe replays the full log from position 0,
        // so wipe the store first and rebuild — avoids doubled text deltas.
        this.store.getState().clearAllStates();
        hydrateFromHistory(this.store, initialMessages);

        let sawTransientError = false;
        let sawTerminal = false;
        try {
          const stream: AsyncGenerator<DistriChatMessage> = agent.resubscribe(taskId, { signal: ac.signal });
          for await (const evt of stream) {
            if (this.cancelled || ac.signal.aborted) break;
            this.store.getState().processMessage(evt, true);
            const type = (evt as { type?: string }).type;
            const evtTaskId = (evt as { taskId?: string }).taskId;
            const code = (evt as { data?: { code?: string } }).data?.code;
            if (type === 'run_error' && code === 'STREAM_ERROR') {
              sawTransientError = true;
              const msg = (evt as { data?: { message?: string } }).data?.message ?? 'Stream error';
              const e = new Error(msg);
              onError?.(e);
            } else if ((type === 'run_finished' || type === 'run_error') && evtTaskId === taskId) {
              sawTerminal = true;
            }
          }
        } catch (e) {
          sawTransientError = true;
          const err = e instanceof Error ? e : new Error(String(e));
          onError?.(err);
        }

        if (this.cancelled || ac.signal.aborted) return;
        if (sawTerminal || !sawTransientError) {
          // Terminal frame seen, or the server closed the stream cleanly
          // (it only closes on the task's own terminal — `until_own_terminal`).
          onTerminalChange?.(true);
          return;
        }
        // Transient error → reconnect with capped linear backoff.
        attempt += 1;
        if (attempt > MAX_RECONNECTS) {
          onTerminalChange?.(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    };

    void run();
  }

  stop(): void {
    this.cancelled = true;
    this.abortController?.abort();
    this.abortController = null;
  }
}
