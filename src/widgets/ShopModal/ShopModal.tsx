import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { LOCALES } from '../../game/i18n';
import { CATALOG, isComingSoon } from '@state/catalog';
import { closeShop, switchShopTab } from '@state/shopController';
import { ShopTabs } from '@features/shop/ShopTabs';
import { ShopItemCard } from '@features/shop/ShopItemCard';
import { Modal, ModalHeader } from '@ui/Modal';
import styles from './ShopModal.module.scss';

export function ShopModal() {
  const shop = useUi((s) => s.modal.shop);
  const lang = useUi((s) => s.menu.lang);
  const pearls = useProgress((s) => s.pearls);
  const unlocked = useProgress((s) => s.unlocked);
  if (!shop) return null;
  const L = LOCALES[lang];
  const comingSoon = isComingSoon(shop.tab);   // collection temporarily disabled
  const items = comingSoon ? [] : CATALOG.filter((i) => i.axis === shop.tab);
  const owned = items.filter((i) => i.price === 0 || unlocked.includes(i.id)).length;
  const pct = items.length ? Math.round((owned / items.length) * 100) : 0;
  return (
    <Modal testId="shop" onClose={closeShop} width="min(92vw, 460px)">
      <ModalHeader title={L.shop} onClose={closeShop} closeTestId="shop-close" closeLabel={L.lbClose}>
        <span className={styles.balance}><span aria-hidden>🦪</span>{pearls}</span>
      </ModalHeader>

      <ShopTabs L={L} current={shop.tab} onPick={switchShopTab} />

      {comingSoon ? (
        <div className={styles.comingSoon} data-testid="shop-coming-soon">
          <span className={styles.comingSoonIcon} aria-hidden>🌊</span>
          <span>{L.comingSoon}</span>
        </div>
      ) : (
        <>
          <div className={styles.progress}>
            <span className={styles.progressLabel}>{L.shopCollected} {owned}/{items.length}</span>
            <div className={styles.bar}><div className={styles.barFill} style={{ width: `${pct}%` }} /></div>
          </div>

          <div className={styles.list}>
            {items.map((item) => <ShopItemCard key={item.id} item={item} L={L} />)}
          </div>
        </>
      )}
    </Modal>
  );
}
