import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import './Drawer.css';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

export function Drawer({ isOpen, onClose, title, subtitle, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = drawerRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    focusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="depot-drawer-overlay" onClick={onClose} role="presentation">
      <div
        className="depot-drawer-panel"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="depot-drawer-header">
          <div>
            <h2 className="depot-drawer-title">{title}</h2>
            {subtitle && <p className="depot-drawer-subtitle">{subtitle}</p>}
          </div>
          <IconButton label="Close settings" variant="ghost" size="md" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="depot-drawer-content">{children}</div>
      </div>
    </div>
  );
}
