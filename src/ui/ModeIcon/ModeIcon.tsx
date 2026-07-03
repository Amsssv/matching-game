import type { ReactNode } from 'react';
import type { GameMode } from '../../game/modes';

// Line icons (stroke: currentColor) for each mode — used by the mode picker cards and
// the mode-start modal title. Compact contexts (HUD, leaderboard chips) keep MODE_EMOJI.
const PATHS: Record<GameMode, ReactNode> = {
  classic: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2.4" />
      <path d="M12 8.5c1.6-2.4 5 0 0 3.6-5-3.6-1.6-6 0-3.6zM8.5 16h7" />
    </>
  ),
  timeAttack: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9M9.5 2.5h5M18.5 7l1.5-1.5M12 13.5l3 2" />
    </>
  ),
  survival: (
    <>
      <path d="M12 3l7 2.5v5.5c0 4.7-3 8-7 9.5-4-1.5-7-4.8-7-9.5V5.5z" />
      <path d="M9.3 12.2l1.9 1.9 3.6-3.8" />
    </>
  ),
  noMistakes: (
    <>
      <path d="M5 11a7 7 0 0 1 14 0c0 2.4-1.2 3.8-2 4.4V18a1 1 0 0 1-1 1h-.5v-2h-2v2h-3v-2h-2v2H8a1 1 0 0 1-1-1v-2.6C6.2 14.8 5 13.4 5 11z" />
      <circle cx="9" cy="11.5" r="1.4" />
      <circle cx="15" cy="11.5" r="1.4" />
    </>
  ),
};

export function ModeIcon({ mode, className }: { mode: GameMode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[mode]}
    </svg>
  );
}
