import { setModal } from './store';
import type { GameMode } from '../game/modes';

export const openModeStart = (mode: GameMode) => setModal({ modeStart: mode });
export const closeModeStart = () => setModal({ modeStart: null });
