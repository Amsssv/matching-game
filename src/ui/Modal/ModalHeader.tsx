import type { ReactNode } from 'react';
import styles from './ModalHeader.module.scss';

/**
 * Shared modal header: a left-aligned title (flex-fills), an optional right-slot via
 * `children` (e.g. a balance pill), and a × close button. Used by StoreModal / ShopModal
 * so the header markup + close handling + SCSS live in one place.
 */
export function ModalHeader({ title, onClose, closeTestId, closeLabel, children }: {
  title: string;
  onClose: () => void;
  closeTestId: string;
  closeLabel: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <h2 className={styles.title}>{title}</h2>
      {children}
      <button
        type="button"
        data-testid={closeTestId}
        className={styles.close}
        aria-label={closeLabel}
        onClick={onClose}
      >
        ×
      </button>
    </header>
  );
}
