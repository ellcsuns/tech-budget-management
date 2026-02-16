import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { fmt } from '../utils/formatters';

interface EditableCellProps {
  value: number;
  isEdited: boolean;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function EditableCell({ value, isEdited, error, disabled, onChange }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalValue(value.toString()); }, [value]);
  useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

  const handleClick = () => { if (!disabled) setIsEditing(true); };
  const handleBlur = () => { setIsEditing(false); onChange(localValue); };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleBlur();
    else if (e.key === 'Escape') { setLocalValue(value.toString()); setIsEditing(false); }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-2">
        <input ref={inputRef} type="text" value={localValue}
          onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </td>
    );
  }

  return (
    <td className={`px-4 py-2 text-sm text-right cursor-pointer border ${isEdited ? 'bg-yellow-100' : 'bg-white'} ${error ? 'border-red-500' : 'border-gray-200'} ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}`}
      onClick={handleClick} title={error || undefined}>
      {fmt(value)}
    </td>
  );
}
