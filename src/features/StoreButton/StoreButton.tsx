import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';
import { openStore } from '@state/purchasesController';
import styles from './StoreButton.module.scss';

export function StoreButton() {
  const lang = useUi((s) => s.menu.lang);
  return (
    <button type="button" data-testid="store-open" className={styles.btn} aria-label={LOCALES[lang].storeTitle} onClick={openStore}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5.5 7h13l-1 12.5H6.5L5.5 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    </button>
  );
}
