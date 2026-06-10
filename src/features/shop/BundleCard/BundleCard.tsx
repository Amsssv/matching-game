import { Button } from '@ui/Button';
import { useProgress } from '@hooks/useProgress';
import { useProductPrices } from '@hooks/useProductPrices';
import { buyProduct } from '@state/purchasesController';
import { paymentsAvailable } from '../../../payments';
import { ITEM_BY_ID } from '@state/catalog';
import type { Bundle } from '@state/iap';
import type { Locale } from '../../../game/i18n';
import styles from './BundleCard.module.scss';

export function BundleCard({ bundle, L }: { bundle: Bundle; L: Locale }) {
  const unlocked = useProgress((s) => s.unlocked);
  const prices = useProductPrices();
  const owned = bundle.items.every((id) => unlocked.includes(id));
  const contents = bundle.items.map((id) => L.shopItems[ITEM_BY_ID[id].nameKey]).join(', ');
  return (
    <div className={styles.root} data-testid={`bundle-${bundle.id}`}>
      <div className={styles.info}>
        <span className={styles.name}>✨ {L.shopItems[bundle.nameKey]}</span>
        <span className={styles.includes}>{L.bundleIncludes} {contents} · +{bundle.pearls} 🦪</span>
      </div>
      {owned ? (
        <span className={styles.state}>✓ {L.bundleOwned}</span>
      ) : paymentsAvailable() ? (
        <Button type="primary" size="small" testId={`bundle-buy-${bundle.id}`} onClick={() => { void buyProduct(bundle.id); }}>
          {`💳 ${prices[bundle.id] ?? L.iapBuy}`}
        </Button>
      ) : null}
    </div>
  );
}
