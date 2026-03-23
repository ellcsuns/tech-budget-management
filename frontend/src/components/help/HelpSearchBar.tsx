import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useI18n } from '../../contexts/I18nContext';

interface HelpSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HelpSearchBar({ value, onChange }: HelpSearchBarProps) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('help.searchPlaceholder')}
        aria-label={t('help.searchAriaLabel')}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ring-accent"
      />
    </div>
  );
}
