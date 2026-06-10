import { setModal } from './store';

export const openHelp = (): void => setModal({ help: true });
export const closeHelp = (): void => setModal({ help: false });
