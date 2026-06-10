import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { openStore } from '@state/purchasesController';
import styles from './StoreButton.module.scss';

export function StoreButton() {
  const lang = useUi((s) => s.menu.lang);
  return (
    <button type="button" data-testid="store-open" className={styles.btn} aria-label={LOCALES[lang].storeTitle} onClick={openStore}>
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
        <path d="M2.5 4h2.2l2.1 10.4a1 1 0 0 0 1 .8h7.7a1 1 0 0 0 1-.8L19 7.5H6.2" />
      </svg>
    </button>
  );
}
