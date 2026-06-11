import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { openStore } from '@state/purchasesController';
import { paymentsAvailable } from '../../payments';
import styles from './PearlBalance.module.scss';

/** Compact balance so the pill stays narrow: 0–999 as-is, then 1k / 14.2k / 1.2M. */
function formatPearls(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function PearlBalance() {
  const pearls = useProgress((s) => s.pearls);
  const lang = useUi((s) => s.menu.lang);
  const label = formatPearls(pearls);
  // No payments environment (non-Yandex host) → plain, non-interactive pill.
  if (!paymentsAvailable()) {
    return (
      <div className={styles.root} data-testid="pearl-balance">
        <span className={styles.icon} aria-hidden>🦪</span>
        <span className={styles.count}>{label}</span>
      </div>
    );
  }
  return (
    <button type="button" className={styles.root} data-testid="pearl-balance" aria-label={LOCALES[lang].storeTitle} onClick={openStore}>
      <span className={styles.icon} aria-hidden>🦪</span>
      <span className={styles.count}>{label}</span>
      <span className={styles.plus} aria-hidden>＋</span>
    </button>
  );
}
