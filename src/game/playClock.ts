export interface ClockState { startedAt: number; pausedTotal: number; pausedAt: number | null; }

/** Whole elapsed seconds, excluding paused spans. Pure. */
export function computeElapsed(s: ClockState, now: number): number {
  const end = s.pausedAt ?? now;
  return Math.max(0, Math.floor((end - s.startedAt - s.pausedTotal) / 1000));
}

/**
 * A play-clock that ticks off a DOM interval (independent of the Phaser loop, so it
 * keeps counting while render-on-demand sleeps the loop). Pauses while the tab is hidden.
 */
export function createPlayClock(onTick: (seconds: number) => void) {
  const now = () => performance.now();
  const s: ClockState = { startedAt: now(), pausedTotal: 0, pausedAt: null };
  let interval: number | undefined;
  const emit = () => onTick(computeElapsed(s, now()));
  function pause() { if (s.pausedAt == null) s.pausedAt = now(); }
  function resume() { if (s.pausedAt != null) { s.pausedTotal += now() - s.pausedAt; s.pausedAt = null; } }
  const onVisibility = () => { if (document.hidden) pause(); else resume(); };
  return {
    start() {
      s.startedAt = now(); s.pausedTotal = 0; s.pausedAt = document.hidden ? now() : null;
      emit();
      interval = window.setInterval(emit, 500);
      document.addEventListener('visibilitychange', onVisibility);
    },
    seconds: () => computeElapsed(s, now()),
    stop() {
      if (interval !== undefined) window.clearInterval(interval);
      interval = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
      return computeElapsed(s, now());
    },
  };
}
