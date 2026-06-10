import { setModal } from './store';

export const openProfile = (): void => setModal({ profile: true });
export const closeProfile = (): void => setModal({ profile: false });
