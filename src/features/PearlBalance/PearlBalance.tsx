import { useProgress } from '@hooks/useProgress';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { openStore } from '@state/purchasesController';
import { paymentsAvailable } from '../../payments';
import styles from './PearlBalance.module.scss';

export function PearlBalance() {
  const pearls = useProgress((s) => s.pearls);
  const lang = useUi((s) => s.menu.lang);
  // No payments environment (non-Yandex host) → plain, non-interactive pill.
  if (!paymentsAvailable()) {
    return (
      <div className={styles.root} data-testid="pearl-balance">
        <span className={styles.icon} aria-hidden>🦪</span>
        <span className={styles.count}>{pearls}</span>
      </div>
    );
  }
  return (
    <button type="button" className={styles.root} data-testid="pearl-balance" aria-label={LOCALES[lang].storeTitle} onClick={openStore}>
      <span className={styles.icon} aria-hidden>🦪</span>
      <span className={styles.count}>{pearls}</span>
      <span className={styles.plus} aria-hidden>＋</span>
    </button>
  );
}
