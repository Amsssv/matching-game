import type { Difficulty } from '../game/layout';
import type { Lang } from '../game/i18n';
import type { LeaderboardData } from '../game/leaderboard';
import type { CustomAxis } from './catalog';

export interface MenuState {
  active: boolean;
  difficulty: Difficulty;
  soundEnabled: boolean;
  lang: Lang;
}

export interface HudState {
  active: boolean;
  timer: string;   // "0:00"
  moves: string;   // localized "Ходов: 3"
  pairs: string;   // localized "Пар: 2 / 10"
  pairsFound: number;
}

export interface VictoryView {
  moves: number;
  seconds: number;
  compact: LeaderboardData | null;  // filled after fetch
  showAuthCta: boolean;
  pearlsEarned: number;   // pearls awarded for this win (shown in the victory modal)
}

export interface LeaderboardView {
  difficulty: Difficulty;
  data: LeaderboardData | null;     // null = loading
  isGuest: boolean;
  source: 'menu' | 'victory';
}

export interface ModalState {
  victory: VictoryView | null;
  leaderboard: LeaderboardView | null;
  shop: { tab: CustomAxis } | null;
}

export interface TransitionState {
  /**
   * Drives the DOM overlay's cross-fade so it tracks Phaser's 300ms camera fade
   * between scenes. Scenes set `false` right before a `fadeOut` and `true` in
   * their `create()` (alongside `fadeIn`).
   */
  visible: boolean;
}

/**
 * Single UI store shape. One store with four independent slices; setters in
 * `store.ts` replace only their own slice so slice-scoped selectors
 * (`useUi(s => s.menu)`) re-render only the components that read that slice.
 */
export interface UiState {
  menu: MenuState;
  hud: HudState;
  modal: ModalState;
  transition: TransitionState;
}
