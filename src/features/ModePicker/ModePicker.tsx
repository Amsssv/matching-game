import { cx } from '@ui/cx';
import { ModeIcon } from '@ui/ModeIcon';
import { levelFromXp, xpForLevel } from '@state/progress';
import styles from './ModePicker.module.scss';
import { MODE_ORDER, MODE_UNLOCK, type GameMode } from '../../game/modes';
import type { Locale } from '../../game/i18n';

// Classic is the entry mode — always highlighted as the recommended starting point.
const RECOMMENDED: GameMode = 'classic';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ModePicker({
  L, xp, onPick,
}: { L: Locale; xp: number; onPick: (m: GameMode) => void }) {
  const level = levelFromXp(xp).level;
  return (
    <div className={styles.root} data-testid="modes">
      <p className={styles.label}>{L.modesTitle}</p>
      <div className={styles.grid}>
        {MODE_ORDER.map((m) => {
          const locked = level < MODE_UNLOCK[m];
          const recommended = m === RECOMMENDED && !locked;
          const progress = locked ? Math.min(1, xp / xpForLevel(MODE_UNLOCK[m])) : 0;
          return (
            <button
              key={m}
              type="button"
              data-testid={`mode-${m}`}
              disabled={locked}
              className={cx(styles.card, locked ? styles.locked : recommended ? styles.rec : styles.normal)}
              onClick={() => { if (!locked) onPick(m); }}
            >
              {recommended && <span className={styles.ribbon}>{L.modeRecommended}</span>}
              <span className={styles.ico}><ModeIcon mode={m} /></span>
              <span className={styles.body}>
                <span className={styles.name}>{L.modeLabels[m]}</span>
                {locked && (
                  <span className={styles.unlock}>
                    <span className={styles.ubar}><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
                    <span className={styles.utxt}>{L.modeLockedLv(MODE_UNLOCK[m])}</span>
                  </span>
                )}
              </span>
              <span className={styles.aff}>{locked ? <LockIcon /> : <ChevronIcon />}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
