import { signal, Signal } from '@angular/core';

/**
 * Structural subset of a Zustand vanilla store (`StoreApi<T>`) — duck-typed
 * so this package doesn't need `zustand` as its own dependency.
 */
export interface ReadableStore<T> {
  getState(): T;
  subscribe(listener: (state: T) => void): () => void;
}

/**
 * Bridges a `@distri/state` vanilla store's `subscribe()` into an Angular
 * `Signal`. This is the one piece of glue Angular needs on top of
 * `@distri/state` — the store itself has no idea Angular exists.
 */
export function toSignal<T, S>(store: ReadableStore<T>, selector: (state: T) => S): Signal<S> {
  const sig = signal(selector(store.getState()));
  store.subscribe((state) => {
    sig.set(selector(state));
  });
  return sig.asReadonly();
}
