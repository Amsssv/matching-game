import { useSyncExternalStore } from 'react';

type Listener = () => void;

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(l: Listener): () => void;
  reset(): void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  const initialSnapshot = { ...initial };
  let state: T = { ...initial };
  const listeners = new Set<Listener>();
  let queued = false;

  const flush = () => { queued = false; for (const l of listeners) l(); };
  const schedule = () => { if (!queued) { queued = true; queueMicrotask(flush); } };

  return {
    get: () => state,
    set: (patch) => { state = { ...state, ...patch }; schedule(); },
    subscribe: (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    reset: () => { state = { ...initialSnapshot }; schedule(); },
  };
}

/**
 * Subscribe a component to a store. Pass a `selector` to read one slice so the
 * component re-renders only when that slice's reference changes (Object.is in
 * `useSyncExternalStore`). Setters in `store.ts` replace only their own slice,
 * so `useStore(uiStore, s => s.menu)` is stable until `menu` actually changes.
 *
 * The selector MUST return a stable reference (a slice or a primitive) — never
 * a freshly-built object/array, or React loops on the "getSnapshot should be
 * cached" guard.
 */
export function useStore<T extends object>(store: Store<T>): T;
export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S;
export function useStore<T extends object, S>(store: Store<T>, selector?: (s: T) => S): T | S {
  const getSnapshot: () => T | S = selector ? () => selector(store.get()) : () => store.get();
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
