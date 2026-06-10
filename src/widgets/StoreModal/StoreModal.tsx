import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProductPrices } from '@hooks/useProductPrices';
import { LOCALES } from '../../game/i18n';
import { PEARL_PACKS, BUNDLES } from '@state/iap';
import { CATALOG } from '@state/catalog';
import { buyProduct, closeStore } from '@state/purchasesController';
import { Button } from '@ui/Button';
import { ShopItemCard } from '@features/shop/ShopItemCard';
import { BundleCard } from '@features/shop/BundleCard';
import styles from './StoreModal.module.scss';

const EXCLUSIVES = CATALOG.filter((i) => i.exclusive);

export function StoreModal() {
  const open = useUi((s) => s.modal.store);
  const lang = useUi((s) => s.menu.lang);
  const prices = useProductPrices();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeStore(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="store" onClick={closeStore}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>{L.storeTitle}</h2>
          <button type="button" data-testid="store-close" className={styles.close} aria-label={L.lbClose} onClick={closeStore}>×</button>
        </header>
        <div className={styles.list}>
          <h3 className={styles.section}>{L.storePacks}</h3>
          {PEARL_PACKS.map((pack) => (
            <div key={pack.id} className={styles.pack} data-testid={`store-pack-${pack.id}`}>
              <span className={styles.amount}>🦪 {pack.pearls}</span>
              <Button type="primary" size="small" onClick={() => { void buyProduct(pack.id); }}>
                {prices[pack.id] ?? L.iapBuy}
              </Button>
            </div>
          ))}

          <h3 className={styles.section}>{L.storeBundles}</h3>
          {BUNDLES.map((b) => <BundleCard key={b.id} bundle={b} L={L} />)}

          <h3 className={styles.section}>{L.shopTabExclusive}</h3>
          {EXCLUSIVES.map((item) => <ShopItemCard key={item.id} item={item} L={L} />)}
        </div>
      </div>
    </div>
  );
}
