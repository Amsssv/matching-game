import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProductPrices } from '@hooks/useProductPrices';
import { LOCALES } from '../../game/i18n';
import { PEARL_PACKS } from '@state/iap';
import { buyPack, closeTopup } from '@state/purchasesController';
import { Button } from '@ui/Button';
import styles from './TopupModal.module.scss';

export function TopupModal() {
  const open = useUi((s) => s.modal.topup);
  const lang = useUi((s) => s.menu.lang);
  const prices = useProductPrices();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTopup(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="topup" onClick={closeTopup}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>{L.topupTitle}</h2>
          <button type="button" data-testid="topup-close" className={styles.close} aria-label={L.lbClose} onClick={closeTopup}>×</button>
        </header>
        <div className={styles.list}>
          {PEARL_PACKS.map((pack) => (
            <div key={pack.id} className={styles.pack} data-testid={`topup-pack-${pack.id}`}>
              <span className={styles.amount}>🦪 {pack.pearls}</span>
              <Button type="primary" size="small" onClick={() => { void buyPack(pack.id); }}>
                {prices[pack.id] ?? L.iapBuy}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
