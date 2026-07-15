import { useUi } from '@hooks/useUiStore';
import { useProductPrices } from '@hooks/useProductPrices';
import { LOCALES } from '../../game/i18n';
import { PEARL_PACKS, BUNDLES } from '@state/iap';
import { buyProduct, closeStore } from '@state/purchasesController';
import { Button } from '@ui/Button';
import { Modal, ModalHeader } from '@ui/Modal';
import { BundleCard } from '@features/shop/BundleCard';
import styles from './StoreModal.module.scss';

export function StoreModal() {
  const open = useUi((s) => s.modal.store);
  const lang = useUi((s) => s.menu.lang);
  const prices = useProductPrices();
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <Modal testId="store" onClose={closeStore} width="min(94vw, 460px)">
      <ModalHeader title={L.storeTitle} onClose={closeStore} closeTestId="store-close" closeLabel={L.lbClose} />
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
      </div>
    </Modal>
  );
}
