import { useState } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2';
import { useI18n } from '../../contexts/I18nContext';

interface HelpSectionDef {
  id: string;
  titleKey: string;
  contentKeys: string[];
  infographic?: React.ComponentType<{ t: (key: string) => string }>;
}

interface HelpTableOfContentsProps {
  sections: HelpSectionDef[];
  activeSectionId: string | null;
  onSectionClick: (id: string) => void;
  variant?: 'desktop' | 'mobile';
}

export default function HelpTableOfContents({ sections, activeSectionId, onSectionClick, variant = 'desktop' }: HelpTableOfContentsProps) {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    onSectionClick(id);
    setMobileOpen(false);
  };

  const listContent = (
    <ul className="space-y-1">
      {sections.map((section) => {
        const isActive = activeSectionId === section.id;
        return (
          <li key={section.id}>
            <button
              onClick={() => handleClick(section.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClick(section.id); }}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors border-l-2 ${
                isActive
                  ? 'text-accent font-semibold border-accent bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t(section.titleKey)}
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (variant === 'mobile') {
    return (
      <nav className="lg:hidden mb-4" aria-label={t('help.tocTitle')}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span>{t('help.tocTitle')}</span>
          {mobileOpen ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
        </button>
        {mobileOpen && <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2">{listContent}</div>}
      </nav>
    );
  }

  return (
    <nav aria-label={t('help.tocTitle')}>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-3">
        {t('help.tocTitle')}
      </h3>
      {listContent}
    </nav>
  );
}
