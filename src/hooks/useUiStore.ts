import { uiStore } from '../state/store';
import { useStore } from '../state/createStore';
import type { UiState } from '../state/types';

/**
 * Read a slice of the UI store. Re-renders only when the selected slice's
 * reference changes — e.g. `useUi(s => s.menu)` ignores HUD/modal updates.
 */
export function useUi<S>(selector: (s: UiState) => S): S {
  return useStore(uiStore, selector);
}

