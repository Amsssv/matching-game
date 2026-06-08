import { describe, it, expect } from 'vitest';
import { createStore } from '../createStore';

describe('createStore', () => {
  it('merges patches and exposes current state', () => {
    const s = createStore({ a: 1, b: 2 });
    s.set({ b: 5 });
    expect(s.get()).toEqual({ a: 1, b: 5 });
  });

  it('batches notifications into one microtask', async () => {
    const s = createStore({ n: 0 });
    let calls = 0;
    s.subscribe(() => { calls++; });
    s.set({ n: 1 }); s.set({ n: 2 }); s.set({ n: 3 });
    expect(calls).toBe(0);            // not yet flushed
    await Promise.resolve();          // drain microtasks
    expect(calls).toBe(1);            // one batched notify
    expect(s.get().n).toBe(3);
  });

  it('reset restores initial state', () => {
    const s = createStore({ x: 0 });
    s.set({ x: 9 });
    s.reset();
    expect(s.get()).toEqual({ x: 0 });
  });
});
