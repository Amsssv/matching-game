import { useEffect, type ReactNode, type CSSProperties } from 'react';
import { cx } from '../cx';
import styles from './Modal.module.scss';

export interface ModalProps {
  /** data-testid on the backdrop (preserves e2e selectors). */
  testId: string;
  /** When set, Esc and a backdrop click dismiss the modal. Omit for non-dismissible modals. */
  onClose?: () => void;
  /** CSS length for the panel width, e.g. "min(92vw, 486px)". Falls back to the modal-panel default. */
  width?: string;
  /** When set, the panel gets role="dialog" + this aria-label. */
  ariaLabel?: string;
  /** Extra class on the panel (rare per-modal tweaks). */
  panelClassName?: string;
  /** Extra class on the backdrop (rare). */
  className?: string;
  children: ReactNode;
}

export function Modal({ testId, onClose, width, ariaLabel, panelClassName, className, children }: ModalProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const panelStyle = width ? ({ ['--modal-w']: width } as CSSProperties) : undefined;

  return (
    <div
      className={cx(styles.backdrop, className)}
      data-testid={testId}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        className={cx(styles.panel, panelClassName)}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role={ariaLabel ? 'dialog' : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
