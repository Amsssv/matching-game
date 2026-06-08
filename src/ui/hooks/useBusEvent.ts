import { useEffect } from 'react';
import { bus, type BusEvents } from '../../state/eventBus';

/**
 * Subscribe a component to a command-bus event for its lifetime. Handlers that
 * close over props/state should be wrapped in `useCallback` by the caller so the
 * effect doesn't re-subscribe every render.
 */
export function useBusEvent<K extends keyof BusEvents>(
  type: K,
  handler: (payload: BusEvents[K]) => void,
): void {
  useEffect(() => bus.on(type, handler), [type, handler]);
}
