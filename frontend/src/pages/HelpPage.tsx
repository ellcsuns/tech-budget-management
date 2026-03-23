import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import HelpSearchBar from '../components/help/HelpSearchBar';
import HelpTableOfContents from '../components/help/HelpTableOfContents';
import HelpSection from '../components/help/HelpSection';
import BudgetFlowInfographic from '../components/help/infographics/BudgetFlowInfographic';
import TransactionFlowInfographic from '../components/help/infographics/TransactionFlowInfographic';
import ApprovalFlowInfographic from '../components/help/infographics/ApprovalFlowInfographic';
import RolesPermissionsInfographic from '../components/help/infographics/RolesPermissionsInfographic';
import DashboardInfographic from '../components/help/infographics/DashboardInfographic';
import BudgetLineInfographic from '../components/help/infographics/BudgetLineInfographic';
import SavingsEffectInfographic from '../components/help/infographics/SavingsEffectInfographic';

interface HelpSectionDef {
  id: string;
  titleKey: string;
  contentKeys: string[];
  infographic?: React.ComponentType<{ t: (key: string) => string }>;
}

const SECTIONS: HelpSectionDef[] = [
  {
    id: 'budget-calculation',
    titleKey: 'help.section.budgetCalc.title',
    contentKeys: [
      'help.section.budgetCalc.description1',
      'help.section.budgetCalc.description2',
      'help.section.budgetCalc.description3',
      'help.section.budgetCalc.description4',
      'help.section.budgetCalc.description5',
      'help.section.budgetCalc.description6',
      'help.section.budgetCalc.description7',
    ],
    infographic: BudgetFlowInfographic,
  },
  {
    id: 'dashboard',
    titleKey: 'help.section.dashboard.title',
    contentKeys: [
      'help.section.dashboard.description1',
      'help.section.dashboard.description2',
      'help.section.dashboard.description3',
    ],
    infographic: DashboardInfographic,
  },
  {
    id: 'budgets',
    titleKey: 'help.section.budgets.title',
    contentKeys: [
      'help.section.budgets.description1',
      'help.section.budgets.description2',
      'help.section.budgets.description3',
      'help.section.budgets.description4',
    ],
    infographic: BudgetLineInfographic,
  },
  {
    id: 'budget-compare',
    titleKey: 'help.section.budgetCompare.title',
    contentKeys: [
      'help.section.budgetCompare.description1',
      'help.section.budgetCompare.description2',
    ],
  },
  {
    id: 'savings',
    titleKey: 'help.section.savings.title',
    contentKeys: [
      'help.section.savings.description1',
      'help.section.savings.description2',
      'help.section.savings.description3',
    ],
    infographic: SavingsEffectInfographic,
  },
  {
    id: 'deferrals',
    titleKey: 'help.section.deferrals.title',
    contentKeys: [
      'help.section.deferrals.description1',
      'help.section.deferrals.description2',
    ],
  },
  {
    id: 'approvals',
    titleKey: 'help.section.approvals.title',
    contentKeys: [
      'help.section.approvals.description1',
      'help.section.approvals.description2',
      'help.section.approvals.description3',
    ],
    infographic: ApprovalFlowInfographic,
  },
  {
    id: 'expenses',
    titleKey: 'help.section.expenses.title',
    contentKeys: [
      'help.section.expenses.description1',
      'help.section.expenses.description2',
    ],
  },
  {
    id: 'transactions',
    titleKey: 'help.section.transactions.title',
    contentKeys: [
      'help.section.transactions.description1',
      'help.section.transactions.description2',
      'help.section.transactions.description3',
      'help.section.transactions.description4',
    ],
    infographic: TransactionFlowInfographic,
  },
  {
    id: 'exchange-rates',
    titleKey: 'help.section.exchangeRates.title',
    contentKeys: [
      'help.section.exchangeRates.description1',
      'help.section.exchangeRates.description2',
    ],
  },
  {
    id: 'reports',
    titleKey: 'help.section.reports.title',
    contentKeys: [
      'help.section.reports.description1',
      'help.section.reports.description2',
    ],
  },
  {
    id: 'detailed-reports',
    titleKey: 'help.section.detailedReports.title',
    contentKeys: [
      'help.section.detailedReports.description1',
      'help.section.detailedReports.description2',
    ],
  },
  {
    id: 'configuration',
    titleKey: 'help.section.configuration.title',
    contentKeys: [
      'help.section.configuration.description1',
      'help.section.configuration.description2',
      'help.section.configuration.description3',
    ],
  },
  {
    id: 'master-data',
    titleKey: 'help.section.masterData.title',
    contentKeys: [
      'help.section.masterData.description1',
      'help.section.masterData.description2',
    ],
  },
  {
    id: 'users-roles',
    titleKey: 'help.section.usersRoles.title',
    contentKeys: [
      'help.section.usersRoles.description1',
      'help.section.usersRoles.description2',
      'help.section.usersRoles.description3',
    ],
    infographic: RolesPermissionsInfographic,
  },
  {
    id: 'translations',
    titleKey: 'help.section.translations.title',
    contentKeys: [
      'help.section.translations.description1',
      'help.section.translations.description2',
    ],
  },
  {
    id: 'audit',
    titleKey: 'help.section.audit.title',
    contentKeys: [
      'help.section.audit.description1',
      'help.section.audit.description2',
    ],
  },
];

export default function HelpPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!debouncedQuery.trim()) return SECTIONS;
    const q = debouncedQuery.toLowerCase();
    return SECTIONS.filter((section) => {
      const title = t(section.titleKey).toLowerCase();
      const content = section.contentKeys.map((k) => t(k).toLowerCase()).join(' ');
      return title.includes(q) || content.includes(q);
    });
  }, [debouncedQuery, t]);

  // IntersectionObserver for active section tracking
  const setSectionRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    } else {
      sectionRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    sectionRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [filteredSections]);

  const handleSectionClick = (id: string) => {
    setActiveSectionId(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header + Search */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('help.title')}</h1>
        <HelpSearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Mobile TOC */}
      <HelpTableOfContents
        sections={filteredSections}
        activeSectionId={activeSectionId}
        onSectionClick={handleSectionClick}
      />

      <div className="flex gap-8">
        {/* Desktop TOC */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <HelpTableOfContents
              sections={filteredSections}
              activeSectionId={activeSectionId}
              onSectionClick={handleSectionClick}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t('help.noResults')} &apos;{debouncedQuery}&apos;</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <HelpSection
                key={section.id}
                section={section}
                ref={(el) => setSectionRef(section.id, el)}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
