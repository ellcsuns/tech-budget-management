interface SaveButtonProps {
  hasUnsavedChanges: boolean;
  hasValidationErrors: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function SaveButton({
  hasUnsavedChanges,
  hasValidationErrors,
  isSaving,
  onSave
}: SaveButtonProps) {
  if (!hasUnsavedChanges) {
    return null;
  }

  const isDisabled = hasValidationErrors || isSaving;

  return (
    <button
      onClick={onSave}
      disabled={isDisabled}
      className={`
        px-6 py-2 rounded-md font-medium transition-colors
        ${isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
        }
      `}
    >
      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  );
}
