import type { Difficulty } from '../game/layout';
import type { Lang } from '../game/i18n';

/**
 * Typed command bus, React → Phaser. Replaces the old `bridge.ts` (which reached
 * into live scenes directly): React components `bus.emit('cmd:…')`, the active
 * scene subscribes in `create()` and unsubscribes on `shutdown`. Only commands
 * that genuinely need the Phaser side (a scene, the AudioManager, the registry)
 * live here — purely React-side actions (leaderboard tab switch/close/login)
 * call `state/leaderboardController` functions directly.
 */
export type BusEvents = {
  'cmd:set-difficulty': { difficulty: Difficulty };
  'cmd:toggle-sound': undefined;
  'cmd:set-lang': { lang: Lang };
  'cmd:play': undefined;
  'cmd:open-leaderboard': { source: 'menu' | 'victory' };
  'cmd:exit-to-menu': undefined;
  'cmd:victory-restart': undefined;
  'cmd:victory-to-menu': undefined;
  'cmd:login-and-save': undefined;
};

type Handler<T> = (payload: T) => void;
type EmitArgs<T> = T extends undefined ? [] : [payload: T];

export interface Bus<E extends Record<string, unknown>> {
  on<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void;
  off<K extends keyof E>(type: K, handler: Handler<E[K]>): void;
  emit<K extends keyof E>(type: K, ...args: EmitArgs<E[K]>): void;
}

function createBus<E extends Record<string, unknown>>(): Bus<E> {
  const handlers = new Map<keyof E, Set<Handler<unknown>>>();
  return {
    on(type, handler) {
      let set = handlers.get(type);
      if (!set) handlers.set(type, (set = new Set()));
      set.add(handler as Handler<unknown>);
      return () => { handlers.get(type)?.delete(handler as Handler<unknown>); };
    },
    off(type, handler) {
      handlers.get(type)?.delete(handler as Handler<unknown>);
    },
    emit(type, ...args) {
      handlers.get(type)?.forEach((h) => h(args[0]));
    },
  };
}

export const bus = createBus<BusEvents>();
