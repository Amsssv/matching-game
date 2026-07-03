import { uiStore, setModal } from './store';
import { fetchLeaderboard } from '../game/leaderboard';
import { getYSDK } from '../ysdk';
import type { Difficulty } from '../game/layout';
import type { GameMode } from '../game/modes';

/**
 * Opens the DOM leaderboard modal. Auth-gating stays Phaser-side per Yandex rule
 * 1.2.1 — we open as guest and surface a "login to save" CTA inside the modal.
 *
 * These are pure React-side state transitions (store + SDK + network), so the
 * modal calls them directly rather than routing through the command bus.
 */
export async function openLeaderboard(source: 'menu' | 'victory', mode?: GameMode) {
  const m: GameMode = mode ?? uiStore.get().menu.mode;   // default = last played mode
  const difficulty: Difficulty = uiStore.get().menu.difficulty;
  let isGuest = false;
  try {
    const sdk = getYSDK();
    if (sdk) isGuest = !(await sdk.getPlayer({ scopes: false })).isAuthorized();
  } catch {
    isGuest = false;
  }
  setModal({ leaderboard: { mode: m, difficulty, data: null, isGuest, source } });
  const data = await fetchLeaderboard(m, difficulty);
  const cur = uiStore.get().modal.leaderboard;
  if (cur && cur.mode === m && cur.difficulty === difficulty) {
    setModal({ leaderboard: { ...cur, data: data ?? { rows: [] } } }); // null (no SDK/error) → empty state (fallback A)
  }
}

async function refetch(mode: GameMode, difficulty: Difficulty) {
  const cur = uiStore.get().modal.leaderboard;
  if (!cur) return;
  setModal({ leaderboard: { ...cur, mode, difficulty, data: null } });
  const data = await fetchLeaderboard(mode, difficulty);
  const now = uiStore.get().modal.leaderboard;
  if (now && now.mode === mode && now.difficulty === difficulty) {
    setModal({ leaderboard: { ...now, data: data ?? { rows: [] } } }); // null (no SDK/error) → empty state (fallback A)
  }
}

export async function switchLeaderboardDifficulty(difficulty: Difficulty) {
  const cur = uiStore.get().modal.leaderboard;
  if (cur) await refetch(cur.mode, difficulty);
}

export async function switchLeaderboardMode(mode: GameMode) {
  const cur = uiStore.get().modal.leaderboard;
  if (cur) await refetch(mode, cur.difficulty);
}

export function closeLeaderboard() {
  setModal({ leaderboard: null });
}

export async function leaderboardLogin() {
  const sdk = getYSDK();
  if (!sdk) return;
  try {
    const authResult = await sdk.auth.openAuthDialog();
    if (authResult.action === 'login') {
      const cur = uiStore.get().modal.leaderboard;
      if (cur) await refetch(cur.mode, cur.difficulty);
    }
  } catch {
    /* user cancelled */
  }
}
