import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { computeClaim, todayStr } from '@state/daily';
import { openDaily } from '@state/dailyController';
import { cx } from '@ui/cx';
import styles from './DailyButton.module.scss';

export function DailyButton() {
  const streak = useProgress((s) => s.streak);
  const lang = useUi((s) => s.menu.lang);
  const available = computeClaim(streak, todayStr()).available;
  return (
    <button
      type="button"
      data-testid="daily-open"
      aria-label={LOCALES[lang].dailyTitle}
      className={cx(styles.btn, available && styles.available)}
      onClick={openDaily}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="8.5" width="17" height="4.5" rx="1" />
        <path d="M5 13v7h14v-7" />
        <path d="M12 8.5V20" />
        <path d="M12 8.5S10.7 4.5 8.3 5.4C6.6 6 7.8 8.5 12 8.5z" />
        <path d="M12 8.5s1.3-4 3.7-3.1c1.7.6.5 3.1-3.7 3.1z" />
      </svg>
      {available && <span className={styles.badge} aria-hidden />}
    </button>
  );
}
