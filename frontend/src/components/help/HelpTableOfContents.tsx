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
}

export default function HelpTableOfContents({ sections, activeSectionId, onSectionClick }: HelpTableOfContentsProps) {
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
                  ? 'text-accent font-semibold border-accent bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t(section.titleKey)}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop */}
      <nav className="hidden lg:block" aria-label={t('help.tocTitle')}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
          {t('help.tocTitle')}
        </h3>
        {listContent}
      </nav>

      {/* Mobile */}
      <nav className="lg:hidden mb-4" aria-label={t('help.tocTitle')}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
        >
          <span>{t('help.tocTitle')}</span>
          {mobileOpen ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
        </button>
        {mobileOpen && <div className="mt-2 bg-white border border-gray-200 rounded-lg p-2">{listContent}</div>}
      </nav>
    </>
  );
}
