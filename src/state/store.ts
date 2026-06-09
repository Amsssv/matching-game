import { createStore } from './createStore';
import type { UiState, MenuState, HudState, ModalState } from './types';

const INITIAL: UiState = {
  menu: { active: false, difficulty: 'medium', soundEnabled: true, lang: 'ru' },
  hud: { active: false, timer: '0:00', moves: '', pairs: '', pairsFound: 0 },
  modal: { victory: null, leaderboard: null, shop: null, daily: null, tasks: null },
  transition: { visible: true },
};

/**
 * The single UI store. Read in React via `useUi(s => s.slice)` (see
 * `ui/hooks/useUiStore`); written from Phaser scenes via the slice setters
 * below. Each setter replaces only its own slice object so slice-scoped
 * selectors stay referentially stable.
 */
export const uiStore = createStore<UiState>(INITIAL);

export const setMenu = (patch: Partial<MenuState>) =>
  uiStore.set({ menu: { ...uiStore.get().menu, ...patch } });

export const setHud = (patch: Partial<HudState>) =>
  uiStore.set({ hud: { ...uiStore.get().hud, ...patch } });

export const setModal = (patch: Partial<ModalState>) =>
  uiStore.set({ modal: { ...uiStore.get().modal, ...patch } });

export const setTransition = (visible: boolean) =>
  uiStore.set({ transition: { visible } });

export const resetUi = () => uiStore.reset();
