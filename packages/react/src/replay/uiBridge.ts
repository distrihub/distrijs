import { useEffect, useRef, useState, type RefObject } from 'react';
import type { UiMutation } from './types';

type MethodBag = Record<string, unknown>;

/**
 * Apply `mutations[fromIndex..toIndex)` to `target` by invoking the named
 * method with the recorded args. Returns the new applied count (`toIndex`).
 *
 * `toIndex` defaults to the end of the array, callers that want the full
 * batch (e.g. existing tests, or `useUiBridge`'s reset-and-replay-from-zero
 * path when it hasn't yet re-rendered) get that by omitting it. `useUiBridge`
 * itself always passes an explicit `toIndex` of `fromIndex + 1`: applying more
 * than one mutation per call is exactly the bug this module fixes (see the
 * doc comment on `useUiBridge`).
 *
 * A missing method is skipped (warn, don't throw): a cassette must never be able
 * to crash the page if a sample's ref API drifts.
 */
export function applyUiMutations(
  target: unknown,
  mutations: UiMutation[],
  fromIndex: number,
  toIndex: number = mutations.length,
): number {
  if (!target) return fromIndex;

  const bag = target as MethodBag;
  for (let i = fromIndex; i < toIndex; i++) {
    const { method, args } = mutations[i];
    const fn = bag[method];
    if (typeof fn !== 'function') {
      console.warn(`[replay] ui_mutation "${method}" is not a method on the target, skipping`);
      continue;
    }
    (fn as (...a: unknown[]) => unknown).apply(bag, args);
  }
  return toIndex;
}

/** Value-compares two mutations by method name and JSON-serialized args. */
function mutationsEqual(a: UiMutation, b: UiMutation): boolean {
  return a.method === b.method && JSON.stringify(a.args) === JSON.stringify(b.args);
}

/**
 * True if `applied` (the mutations already pushed to the target) is a strict
 * prefix of `mutations`, i.e. every previously-applied entry still matches by
 * content at the same index. False for a shrink, or for an equal-or-greater
 * length array whose content has diverged (e.g. a different cassette).
 */
function isContinuation(applied: UiMutation[], mutations: UiMutation[]): boolean {
  if (mutations.length < applied.length) return false;
  return applied.every((m, i) => mutationsEqual(m, mutations[i]));
}

/**
 * Drive a sample's imperative ref from the replay's `uiMutations`.
 *
 * Applies only newly-arrived mutations. When the incoming array is not a
 * continuation of what was already applied, it shrank, or the already-applied
 * prefix no longer matches by content (a different cassette, or rewritten
 * history at the same length), it calls `resetMethod` on the target and
 * replays from zero, so scrubbing/switching leaves the product UI consistent
 * with the playhead. Length alone is never used as a proxy for "unchanged":
 * two same-length arrays with different content are a divergence, not a no-op.
 *
 * ### One mutation (or one reset) per commit
 *
 * The bridge's contract is: *applying N pending mutations at once must behave
 * identically to applying them one per animation frame.* A sample's
 * imperative ref methods are commonly `useCallback`s that close over the
 * sample's own state (e.g. `IncidentForm.submit` closes over `formData`).
 * React only refreshes those closures, via `useImperativeHandle` re-running
 *, after a commit. If this effect called every pending mutation's method
 * synchronously in one pass (e.g. after a scrub that jumps several mutations
 * at once), all of them would run against the *same*, pre-batch closure,
 * so `submit()` invoked right after seven `setValue()`s in the same pass
 * would still see the form's stale default state and fail validation, even
 * though every `setValue` call had already "happened".
 *
 * To avoid that, each effect pass applies **at most one** mutation (or, on a
 * divergence, performs the `reset()` call and nothing else), then bumps a
 * local counter to force a fresh commit. That re-render lets the target's
 * `useImperativeHandle` factory re-run against the updated state, so the next
 * effect pass reads a fresh `ref.current` before applying the next mutation.
 * The effect keeps re-triggering itself this way, one commit at a time,
 * until `appliedRef.current` catches up with `mutations`, including when new
 * mutations arrive mid-drain (e.g. autoplay ticking forward while a backward
 * seek's replay is still draining).
 *
 * `flushSync` cannot be used to collapse this into one pass: React throws
 * ("flushSync was called from inside a lifecycle method") when it's called
 * from inside an effect.
 */
export function useUiBridge<T>(
  ref: RefObject<T | null>,
  mutations: UiMutation[],
  resetMethod = 'reset',
): void {
  // The mutations we've actually applied to the target so far, by content.
  const appliedRef = useRef<UiMutation[]>([]);

  // Bumped after every single mutation/reset application to force another
  // render + effect pass, even though `ref`/`mutations`/`resetMethod` may not
  // have changed identity, see the "One mutation per commit" doc above.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const target = ref.current as MethodBag | null;
    if (!target) return;

    const applied = appliedRef.current;

    if (!isContinuation(applied, mutations)) {
      // Divergence: shrink, or the previously-applied prefix no longer
      // matches (different cassette / rewritten history). Reset, and ONLY
      // reset, this pass; mark applied as empty so the next pass (forced
      // below, unless there's nothing left to apply) starts replaying from
      // zero via the continuation branch.
      const reset = target[resetMethod];
      if (typeof reset === 'function') {
        (reset as () => void).call(target);
      } else {
        console.warn(
          `[replay] ui_mutation reset "${resetMethod}" is not a method on the target, UI may be stale after seeking backwards`,
        );
      }

      appliedRef.current = [];
      if (mutations.length > 0) setTick((n) => n + 1);
      return;
    }

    if (mutations.length === applied.length) {
      // Nothing new since the last run (common at ~20 ticks/sec from
      // useReplay's playback interval, which rebuilds the mutations array
      // identity even when its contents are unchanged), skip the work.
      return;
    }

    // Apply exactly one more mutation, then (if more remain) force another
    // commit so the sample's imperative-handle closures refresh before the
    // next one is applied.
    const nextIndex = applied.length;
    applyUiMutations(target, mutations, nextIndex, nextIndex + 1);
    appliedRef.current = mutations.slice(0, nextIndex + 1);

    if (nextIndex + 1 < mutations.length) {
      setTick((n) => n + 1);
    }
    // `tick` is intentionally in the deps below purely as a re-run trigger
    // (its value is never read in the effect body), every setTick() call
    // above forces exactly one more pass of this effect.
  }, [ref, mutations, resetMethod, tick]);
}
