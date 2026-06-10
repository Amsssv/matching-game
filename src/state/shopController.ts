import { setModal } from './store';
import { equipItem as equipInStore, buyItem as buyInStore } from './progress';
import { applyUiPalette } from './uiPalette';
import { bus } from './eventBus';
import type { CustomAxis, ShopTab } from './catalog';

export function openShop(tab: ShopTab = 'seaTheme') { setModal({ shop: { tab } }); }
export function closeShop() { setModal({ shop: null }); }
export function switchShopTab(tab: ShopTab) { setModal({ shop: { tab } }); }

// Facade so the shop UI imports its whole action surface from one module (@state/shopController).
export function buy(id: string): boolean { return buyInStore(id); }

export function equip(axis: CustomAxis, id: string): void {
  if (!equipInStore(axis, id)) return;   // locked / unknown / wrong axis → no state change, no visual side-effect
  if (axis === 'uiPalette') {
    applyUiPalette(id);          // recolor the React overlay immediately
  } else {
    bus.emit('cmd:equip-changed');   // active scene re-tints the canvas (sea / card-back)
  }
}
