import { useRef, useCallback, useEffect } from 'react';

export function useDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement;
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  const close = useCallback(() => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!inDialog) {
        close();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [close]);

  return {
    dialogRef,
    open,
    close,
  };
}
