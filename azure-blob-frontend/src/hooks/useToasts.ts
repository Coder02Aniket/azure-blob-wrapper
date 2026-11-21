import { useState, useCallback } from 'react';
import type { ToastItem, ToastType } from '../types';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, title, message, type };

    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  return {
    toasts,
    addToast,
    dismissToast,
  };
}
