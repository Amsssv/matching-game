import { getYSDK } from '../ysdk';

/**
 * Returns true if the current device is a phone or tablet.
 * Priority: Yandex SDK deviceInfo → navigator.userAgent → pointer media query.
 */
export function isMobileDevice(): boolean {
  const sdk = getYSDK();
  // deviceInfo.type is null when SDK runs outside the Yandex iframe (local dev).
  // Only trust it when type is set to a real value.
  if (sdk?.deviceInfo?.type) {
    return sdk.deviceInfo.isMobile() || sdk.deviceInfo.isTablet();
  }
  if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return true;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}
