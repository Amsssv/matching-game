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
      🎁
      {available && <span className={styles.badge} aria-hidden />}
    </button>
  );
}
