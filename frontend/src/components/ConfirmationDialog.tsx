interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  message,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirmar Acción</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
