import { describe, it, expect } from 'vitest';
import { CATALOG, COMING_SOON_AXES, ITEM_BY_ID } from '../catalog';

describe('sea catalog', () => {
  const sea = CATALOG.filter((i) => i.axis === 'seaTheme');

  it('has exactly the five real-asset themes', () => {
    expect(sea.map((i) => i.id).sort()).toEqual(
      ['sea.abyss', 'sea.arctic', 'sea.lagoon', 'sea.lava', 'sea.reef'],
    );
  });

  it('lagoon is the free default, others are priced with product ids', () => {
    expect(ITEM_BY_ID['sea.lagoon'].price).toBe(0);
    expect(ITEM_BY_ID['sea.lagoon'].productId).toBeUndefined();
    expect(ITEM_BY_ID['sea.reef']).toMatchObject({ price: 4000, productId: 'sea_reef' });
    expect(ITEM_BY_ID['sea.arctic']).toMatchObject({ price: 5500, productId: 'sea_arctic' });
    expect(ITEM_BY_ID['sea.abyss']).toMatchObject({ price: 7000, productId: 'sea_abyss' });
    expect(ITEM_BY_ID['sea.lava']).toMatchObject({ price: 3000, productId: 'sea_lava' });
  });

  it('sea themes carry no tint (real art shows through)', () => {
    for (const i of sea) expect(i.tint).toBeUndefined();
  });

  it('the removed tint-only themes are gone', () => {
    for (const id of ['sea.tropic', 'sea.dusk', 'sea.ember']) {
      expect(ITEM_BY_ID[id]).toBeUndefined();
    }
  });

  it('the sea section is open (not coming-soon)', () => {
    expect(COMING_SOON_AXES.has('seaTheme')).toBe(false);
  });
});
