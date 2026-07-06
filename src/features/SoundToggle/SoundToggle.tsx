import { cx } from '@ui/cx';
import styles from './SoundToggle.module.scss';
import type { Locale } from '../../game/i18n';

export function SoundToggle({
  L, enabled, onToggle, className,
}: { L: Locale; enabled: boolean; onToggle: () => void; className?: string }) {
  return (
    <div className={cx(styles.sound, className)}>
      <span className={styles.label}>{L.sound}</span>
      <button
        type="button"
        data-testid="sound-toggle"
        aria-label={`${L.sound}: ${enabled ? L.soundOn : L.soundOff}`}
        aria-pressed={enabled}
        className={styles.toggle}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 9h3l4-3.5v13L7 15H4z" fill="currentColor" />
          {enabled ? (
            <path d="M14.5 9a4 4 0 0 1 0 6M16.8 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          ) : (
            <path d="M15.5 9.5l4 4M19.5 9.5l-4 4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
