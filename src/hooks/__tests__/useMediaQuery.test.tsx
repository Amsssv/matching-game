import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useMediaQuery } from '../useMediaQuery';

function installMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  (window as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    media: query,
    get matches() { return matches; },
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  });
  return { set(v: boolean) { matches = v; listeners.forEach((cb) => cb({ matches: v } as MediaQueryListEvent)); } };
}

let root: Root; let container: HTMLDivElement;
function Probe({ q }: { q: string }) { return <span data-testid="v">{String(useMediaQuery(q))}</span>; }
function render(q: string) {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container); act(() => root.render(<Probe q={q} />));
}
const read = () => container.querySelector('[data-testid="v"]')?.textContent;
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('useMediaQuery', () => {
  it('returns the initial match and updates on change', () => {
    const mq = installMatchMedia(true);
    render('(max-width: 700px)');
    expect(read()).toBe('true');
    act(() => mq.set(false));
    expect(read()).toBe('false');
  });
});
