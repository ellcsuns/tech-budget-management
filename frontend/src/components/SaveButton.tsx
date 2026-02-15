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
          : 'btn-success'
        }
      `}
    >
      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  );
}
