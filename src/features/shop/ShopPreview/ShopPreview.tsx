import type { ShopItem } from '@state/catalog';
import { cx } from '@ui/cx';
import styles from './ShopPreview.module.scss';

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const hex = (tint: number | undefined) => '#' + (tint ?? 0xffffff).toString(16).padStart(6, '0');

// UI-palette preview: a tiny mock of the real UI, styled with the palette's hexes.
// Unset tokens fall back to the _tokens.scss defaults so the mock still reads.
function PalettePreview({ item }: { item: ShopItem }) {
  const p = item.palette ?? {};
  const panel = p['navy-soft'] ?? '#002244';
  const accent = p['gold'] ?? '#f7d077';
  const button = p['blue'] ?? '#0d47a1';
  return (
    <div className={styles.uiMock} style={{ background: panel }} aria-hidden>
      <span className={styles.uiTitle} style={{ background: accent }} />
      <span className={styles.uiBtn} style={{ background: button }} />
    </div>
  );
}

// Sea / card-back preview: the real game asset, tinted via multiply (== Phaser setTint).
export function ShopPreview({ item }: { item: ShopItem }) {
  if (item.axis === 'uiPalette') return <PalettePreview item={item} />;
  const isSea = item.axis === 'seaTheme';
  return (
    <div className={cx(styles.thumb, isSea ? styles.sea : styles.card)} aria-hidden>
      <img className={styles.base} src={asset(isSea ? 'assets/bg.webp' : 'assets/cards/back.webp')} alt="" loading="lazy" />
      {isSea && <img className={styles.island} src={asset('assets/iland.webp')} alt="" loading="lazy" />}
      <span className={styles.tint} style={{ background: hex(item.tint) }} />
    </div>
  );
}
