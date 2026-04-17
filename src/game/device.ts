import { getYSDK } from '../ysdk';

/**
 * Returns true if the current device is a phone or tablet.
 * Priority: Yandex SDK deviceInfo → navigator.userAgent → pointer media query.
 */
export function isMobileDevice(): boolean {
  const sdk = getYSDK();
  if (sdk?.deviceInfo) {
    return sdk.deviceInfo.isMobile() || sdk.deviceInfo.isTablet();
  }
  if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return true;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}
