import { forwardRef } from 'react';
import { useI18n } from '../../contexts/I18nContext';

interface HelpSectionDef {
  id: string;
  titleKey: string;
  contentKeys: string[];
  infographic?: React.ComponentType<{ t: (key: string) => string }>;
}

interface HelpSectionProps {
  section: HelpSectionDef;
}

const HelpSection = forwardRef<HTMLElement, HelpSectionProps>(({ section }, ref) => {
  const { t } = useI18n();
  const Infographic = section.infographic;

  return (
    <section id={section.id} ref={ref} className="scroll-mt-24 pb-8 mb-8 border-b border-gray-200 last:border-b-0">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t(section.titleKey)}</h2>
      {section.contentKeys.map((key) => (
        <p key={key} className="text-gray-700 text-sm leading-relaxed mb-3">{t(key)}</p>
      ))}
      {Infographic && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Infographic t={t} />
        </div>
      )}
    </section>
  );
});

HelpSection.displayName = 'HelpSection';
export default HelpSection;
