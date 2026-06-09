import { Button } from '@ui/Button';
import type { CustomAxis } from '@state/catalog';
import type { Locale } from '../../../game/i18n';
import styles from './ShopTabs.module.scss';

const TABS: { axis: CustomAxis; key: 'shopTabSea' | 'shopTabBack' | 'shopTabPalette' }[] = [
  { axis: 'seaTheme',  key: 'shopTabSea' },
  { axis: 'cardBack',  key: 'shopTabBack' },
  { axis: 'uiPalette', key: 'shopTabPalette' },
];

export function ShopTabs({ L, current, onPick }: { L: Locale; current: CustomAxis; onPick: (a: CustomAxis) => void }) {
  return (
    <div className={styles.root} data-testid="shop-tabs">
      {TABS.map(({ axis, key }) => (
        <Button key={axis} testId={`shop-tab-${axis}`} type="primary" size="small"
                active={axis === current} onClick={() => onPick(axis)}>{L[key]}</Button>
      ))}
    </div>
  );
}
