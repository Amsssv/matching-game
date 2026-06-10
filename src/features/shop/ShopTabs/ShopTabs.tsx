import { Button } from '@ui/Button';
import type { ShopTab } from '@state/catalog';
import type { Locale } from '../../../game/i18n';
import styles from './ShopTabs.module.scss';

const TABS: { tab: ShopTab; key: 'shopTabSea' | 'shopTabBack' | 'shopTabPalette' | 'shopTabExclusive' }[] = [
  { tab: 'seaTheme',  key: 'shopTabSea' },
  { tab: 'cardBack',  key: 'shopTabBack' },
  { tab: 'uiPalette', key: 'shopTabPalette' },
  { tab: 'exclusive', key: 'shopTabExclusive' },
];

export function ShopTabs({ L, current, onPick }: { L: Locale; current: ShopTab; onPick: (t: ShopTab) => void }) {
  return (
    <div className={styles.root} data-testid="shop-tabs">
      {TABS.map(({ tab, key }) => (
        <Button key={tab} testId={`shop-tab-${tab}`} type="primary" size="small"
                active={tab === current} onClick={() => onPick(tab)}>{L[key]}</Button>
      ))}
    </div>
  );
}
