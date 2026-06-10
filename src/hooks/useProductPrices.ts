import { useEffect, useState } from 'react';
import { loadCatalogPrices } from '../payments';

let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

/** productId → display price (e.g. "100 YAN"). Empty until loaded / when payments are unavailable. */
export function useProductPrices(): Record<string, string> {
  const [prices, setPrices] = useState<Record<string, string>>(cache ?? {});
  useEffect(() => {
    if (cache) return;
    inflight ??= loadCatalogPrices();
    let alive = true;
    inflight.then((p) => { cache = p; if (alive) setPrices(p); });
    return () => { alive = false; };
  }, []);
  return prices;
}
