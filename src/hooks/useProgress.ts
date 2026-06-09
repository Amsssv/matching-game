import { useStore } from '../state/createStore';
import { progressStore, type ProgressState } from '../state/progress';

/** Read a slice of the persistent progress store. Re-renders only when that slice changes. */
export function useProgress<S>(selector: (s: ProgressState) => S): S {
  return useStore(progressStore, selector);
}
