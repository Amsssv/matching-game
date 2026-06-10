import Phaser from 'phaser';

const SLEEP_GRACE_MS = 400;

/**
 * Render-on-demand controller. Sleeps game.loop when the GameScene board is fully
 * settled (no tweens, no pending flip/match checks) and wakes it on any interaction,
 * tween, or pending check. The DOM play-clock keeps time while asleep; the canvas
 * keeps showing its last frame (the browser holds the last composited buffer).
 */
export function createRenderActivity(game: Phaser.Game) {
  let enabled = false;
  let pendingChecks = 0;
  let sleepTimer: number | undefined;

  const tweensActive = () => {
    const scene = game.scene.getScene('GameScene') as Phaser.Scene | null;
    return !!scene && scene.tweens.getTweens().length > 0;
  };
  const wake = () => {
    if (sleepTimer !== undefined) { window.clearTimeout(sleepTimer); sleepTimer = undefined; }
    game.loop.wake();   // no-op if already awake
  };
  const scheduleSleep = () => {
    if (!enabled) return;
    if (sleepTimer !== undefined) window.clearTimeout(sleepTimer);
    sleepTimer = window.setTimeout(() => {
      sleepTimer = undefined;
      if (enabled && pendingChecks === 0 && !tweensActive()) game.loop.sleep();
    }, SLEEP_GRACE_MS);
  };
  // Capture-phase pointerdown wakes the loop BEFORE Phaser's input plugin processes the tap.
  const onPointerDown = () => { wake(); scheduleSleep(); };

  return {
    enable() {
      if (enabled) return;
      enabled = true;
      document.addEventListener('pointerdown', onPointerDown, true);
      wake();
    },
    disable() {
      enabled = false;
      pendingChecks = 0;
      if (sleepTimer !== undefined) { window.clearTimeout(sleepTimer); sleepTimer = undefined; }
      document.removeEventListener('pointerdown', onPointerDown, true);
      game.loop.wake();   // leave the loop running for the menu
    },
    wake,
    scheduleSleep,
    /** Bracket a pending delayedCall (flip/match) so the loop can't sleep until it fires. */
    beginCheck() { pendingChecks++; wake(); },
    endCheck() { pendingChecks = Math.max(0, pendingChecks - 1); scheduleSleep(); },
  };
}

export type RenderActivity = ReturnType<typeof createRenderActivity>;
