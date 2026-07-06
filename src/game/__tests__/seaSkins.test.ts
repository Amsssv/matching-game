import { describe, it, expect } from 'vitest';
import { SEA_SKINS, skinFor } from '../seaSkins';
import { CATALOG } from '../../state/catalog';

describe('SEA_SKINS', () => {
  it('has an entry for every seaTheme catalog item (no drift)', () => {
    const catalogIds = CATALOG.filter((i) => i.axis === 'seaTheme').map((i) => i.id).sort();
    expect(Object.keys(SEA_SKINS).sort()).toEqual(catalogIds);
  });

  it('the default (lagoon) keeps the legacy texture keys', () => {
    expect(SEA_SKINS['sea.lagoon']).toMatchObject({
      bgKey: 'bg', islandKey: 'island', islandMobileKey: 'island-mobile',
    });
  });

  it('every skin has unique, non-empty texture keys and paths', () => {
    const bgKeys = new Set<string>();
    for (const s of Object.values(SEA_SKINS)) {
      for (const v of [s.bgKey, s.bgPath, s.islandKey, s.islandPath, s.islandMobileKey, s.islandMobilePath]) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
      bgKeys.add(s.bgKey);
    }
    expect(bgKeys.size).toBe(Object.keys(SEA_SKINS).length);
  });

  it('skinFor falls back to lagoon for unknown ids', () => {
    expect(skinFor('nope')).toBe(SEA_SKINS['sea.lagoon']);
  });
});
