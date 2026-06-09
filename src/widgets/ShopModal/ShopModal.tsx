import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { LOCALES } from '../../game/i18n';
import { Button } from '@ui/Button';
import { CATALOG } from '@state/catalog';
import { closeShop, switchShopTab } from '@state/shopController';
import { ShopTabs } from '@features/shop/ShopTabs';
import { ShopItemCard } from '@features/shop/ShopItemCard';
import styles from './ShopModal.module.scss';

export function ShopModal() {
  const shop = useUi((s) => s.modal.shop);
  const lang = useUi((s) => s.menu.lang);
  const pearls = useProgress((s) => s.pearls);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeShop(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!shop) return null;
  const L = LOCALES[lang];
  const items = CATALOG.filter((i) => i.axis === shop.tab);
  return (
    <div className={styles.backdrop} data-testid="shop" onClick={closeShop}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{L.shop} · {pearls} 🦪</h2>
        <ShopTabs L={L} current={shop.tab} onPick={switchShopTab} />
        <div className={styles.list}>
          {items.map((item) => <ShopItemCard key={item.id} item={item} L={L} />)}
        </div>
        <Button testId="shop-close" type="secondary" size="large" onClick={closeShop}>{L.lbClose}</Button>
      </div>
    </div>
  );
}
