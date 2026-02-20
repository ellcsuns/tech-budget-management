import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((text: string, type: ToastType) => void) | null = null;

export function showToast(text: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn(text, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastType) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col gap-0">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type]} text-white px-6 py-3 text-sm text-center cursor-pointer animate-fade-in`}
          onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
