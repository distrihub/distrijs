import { DistriChatMessage, DistriEvent, DistriMessage, isDistriEvent } from '@distri/core';

/**
 * Helpers for durable runs (spec 2026-11-20-durable-runs-and-nodes, S5/S6).
 * Plain data structures; the store and the controller own when they apply.
 */

/** A stable identity for a stream frame, ignoring when it was received. */
export function frameFingerprint(message: DistriChatMessage): string {
  if (isDistriEvent(message)) {
    const e = message as DistriEvent;
    return `e:${e.type}:${e.taskId ?? ''}:${e.attempt ?? ''}:${JSON.stringify(e.data ?? null)}`;
  }
  const m = message as DistriMessage;
  return `m:${m.id ?? ''}:${m.role}:${JSON.stringify(m.parts ?? [])}`;
}

/**
 * Remembers the frames a live stream already delivered, so a
 * `tasks/resubscribe` after a drop — which replays the task's log from the
 * start — only feeds the store what it has not seen. A multiset: two equal
 * frames (the same delta twice) are skipped twice, not forever.
 */
export class ReplayDeduper {
  private seen = new Map<string, number>();

  record(message: DistriChatMessage): void {
    const key = frameFingerprint(message);
    this.seen.set(key, (this.seen.get(key) ?? 0) + 1);
  }

  /**
   * One replay pass. Each replayed frame consumes one remembered copy; a
   * frame with no copy left is new. A pass never changes what is remembered,
   * so a second drop replays against the same memory.
   */
  beginPass(): { isReplayed(message: DistriChatMessage): boolean } {
    const left = new Map(this.seen);
    return {
      isReplayed(message: DistriChatMessage): boolean {
        const key = frameFingerprint(message);
        const n = left.get(key) ?? 0;
        if (n <= 0) return false;
        left.set(key, n - 1);
        return true;
      },
    };
  }
}

/**
 * Drops events of a superseded segment attempt. A crashed segment is re-run
 * with a higher `attempt`; once a step is seen at attempt N, its events at an
 * attempt below N are stale. Events without `attempt` or a step pass through.
 */
export class AttemptFilter {
  private latest = new Map<string, number>();

  /**
   * `drop`: the event belongs to a superseded attempt.
   * `superseded`: this event starts a newer attempt of a step seen before —
   * the caller should discard what the older attempt drew for it.
   */
  check(event: DistriEvent): { drop: boolean; superseded?: { taskId?: string; stepId: string } } {
    const attempt = event.attempt;
    const stepId = event.stepId;
    if (typeof attempt !== 'number' || !stepId) return { drop: false };
    const key = `${event.taskId ?? ''}::${stepId}`;
    const prev = this.latest.get(key);
    if (prev === undefined) {
      this.latest.set(key, attempt);
      return { drop: false };
    }
    if (attempt < prev) return { drop: true };
    if (attempt > prev) {
      this.latest.set(key, attempt);
      return { drop: false, superseded: { taskId: event.taskId, stepId } };
    }
    return { drop: false };
  }

  reset(): void {
    this.latest.clear();
  }
}

const INSTANCE_KEY = 'distri:chat-instance-id';

/**
 * The id this window claims pending calls with. Kept in sessionStorage, so a
 * reload of the same tab is the same instance and can take back the call it
 * claimed before reloading (its claim lease would otherwise make it "another
 * window" for up to a minute). A new tab gets its own id. Without
 * sessionStorage (server, tests, a locked-down iframe): a fresh id.
 */
export function windowInstanceId(make: () => string, storage?: Pick<Storage, 'getItem' | 'setItem'> | null): string {
  let s = storage;
  if (s === undefined) {
    try {
      s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    } catch {
      s = null;
    }
  }
  try {
    const existing = s?.getItem(INSTANCE_KEY);
    if (existing) return existing;
    const id = make();
    s?.setItem(INSTANCE_KEY, id);
    return id;
  } catch {
    return make();
  }
}
