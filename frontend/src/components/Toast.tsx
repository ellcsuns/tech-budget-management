import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface TechnicalDetails {
  stack?: string | null;
  code?: string | null;
  meta?: any;
}

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  technicalDetails?: TechnicalDetails | null;
}

let toastId = 0;
let addToastFn: ((text: string, type: ToastType, technicalDetails?: TechnicalDetails | null) => void) | null = null;
let _canViewTechnicalErrors = false;

export function setCanViewTechnicalErrors(value: boolean) {
  _canViewTechnicalErrors = value;
}

export function showToast(text: string, type: ToastType = 'info', technicalDetails?: TechnicalDetails | null) {
  if (addToastFn) addToastFn(text, type, technicalDetails);
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), 8000);
    setTimerId(id);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
    if (!expanded && timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const showTechLink = _canViewTechnicalErrors && toast.type === 'error' && toast.technicalDetails;

  return (
    <div className={`${colors[toast.type]} text-white px-6 py-3 text-sm text-center cursor-pointer animate-fade-in`}
      onClick={() => onDismiss(toast.id)}>
      <div>{toast.text}</div>
      {showTechLink && (
        <div className="mt-1">
          <button onClick={handleExpand} className="underline text-xs opacity-80 hover:opacity-100">
            {expanded ? 'Ocultar detalle técnico' : 'Visualizar detalle técnico'}
          </button>
          {expanded && (
            <pre className="mt-2 text-left text-xs bg-black bg-opacity-30 p-3 rounded max-h-48 overflow-auto whitespace-pre-wrap" onClick={e => e.stopPropagation()}>
              {JSON.stringify(toast.technicalDetails, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastType, technicalDetails?: TechnicalDetails | null) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, text, type, technicalDetails }]);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col gap-0">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
