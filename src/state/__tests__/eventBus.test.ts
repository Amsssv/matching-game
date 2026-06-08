import { describe, it, expect, vi } from 'vitest';
import { bus } from '../eventBus';

describe('eventBus', () => {
  it('delivers an emitted payload to a subscriber', () => {
    const seen: string[] = [];
    const off = bus.on('cmd:set-lang', ({ lang }) => seen.push(lang));
    bus.emit('cmd:set-lang', { lang: 'en' });
    expect(seen).toEqual(['en']);
    off();
  });

  it('fans out to every subscriber of a payload-less event', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.on('cmd:play', a);
    const offB = bus.on('cmd:play', b);
    bus.emit('cmd:play');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA(); offB();
  });

  it('stops delivering after the returned unsubscribe runs', () => {
    const h = vi.fn();
    const off = bus.on('cmd:toggle-sound', h);
    off();
    bus.emit('cmd:toggle-sound');
    expect(h).not.toHaveBeenCalled();
  });

  it('off() removes a specific handler', () => {
    const h = vi.fn();
    bus.on('cmd:exit-to-menu', h);
    bus.off('cmd:exit-to-menu', h);
    bus.emit('cmd:exit-to-menu');
    expect(h).not.toHaveBeenCalled();
  });
});
