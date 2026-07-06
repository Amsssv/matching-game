import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Modal } from '../Modal';

let container: HTMLDivElement;
let root: Root;

function render(ui: React.ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(ui); });
}
afterEach(() => { act(() => root.unmount()); container.remove(); });

const backdrop = () => container.querySelector('[data-testid="m"]') as HTMLElement;
const panel = () => backdrop().firstElementChild as HTMLElement;

describe('Modal', () => {
  it('Escape calls onClose when dismissible', () => {
    const onClose = vi.fn();
    render(<Modal testId="m" onClose={onClose}>x</Modal>);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape does nothing when not dismissible', () => {
    render(<Modal testId="m">x</Modal>);
    expect(() => act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); })).not.toThrow();
    expect(backdrop().onclick).toBeNull(); // no backdrop click handler either
  });

  it('a click on the backdrop closes, a click on the panel does not', () => {
    const onClose = vi.fn();
    render(<Modal testId="m" onClose={onClose}><button>inside</button></Modal>);
    act(() => { panel().click(); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { backdrop().click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets role=dialog + aria-label and the width custom property', () => {
    render(<Modal testId="m" ariaLabel="Hi" width="123px">x</Modal>);
    expect(panel().getAttribute('role')).toBe('dialog');
    expect(panel().getAttribute('aria-label')).toBe('Hi');
    expect(panel().style.getPropertyValue('--modal-w')).toBe('123px');
  });
});
