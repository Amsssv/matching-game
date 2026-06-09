import { Button } from '@ui/Button';
import { useProgress } from '@hooks/useProgress';
import { buy, equip } from '@state/shopController';
import type { ShopItem } from '@state/catalog';
import type { Locale } from '../../../game/i18n';
import { cx } from '@ui/cx';
import { ShopPreview } from '../ShopPreview';
import styles from './ShopItemCard.module.scss';

export function ShopItemCard({ item, L }: { item: ShopItem; L: Locale }) {
  const equippedId = useProgress((s) => s.equipped[item.axis]);
  const unlocked = useProgress((s) => s.unlocked);
  const pearls = useProgress((s) => s.pearls);
  const equipped = equippedId === item.id;
  const owned = item.price === 0 || unlocked.includes(item.id);
  const affordable = pearls >= item.price;
  return (
    <div className={cx(styles.root, equipped && styles.equipped)} data-testid={`shop-item-${item.id}`}>
      <ShopPreview item={item} />
      <span className={styles.name}>{L.shopItems[item.nameKey]}</span>
      {equipped
        ? <span className={styles.state}>{L.shopEquipped}</span>
        : owned
          ? <Button type="secondary" size="small" onClick={() => equip(item.axis, item.id)}>{L.shopEquip}</Button>
          : <Button type="primary" size="small" disabled={!affordable}
                    className={cx(!affordable && styles.cantAfford)}
                    onClick={() => { if (buy(item.id)) equip(item.axis, item.id); }}>{`${item.price} 🦪`}</Button>}
    </div>
  );
}
