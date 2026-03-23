interface InfographicProps { t: (key: string) => string; }

export default function BudgetFlowInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 800 280" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.budgetFlow.formula')}>
      {/* Plan box */}
      <rect x="10" y="40" width="120" height="60" rx="8" fill="var(--color-primary)" opacity="0.9" />
      <text x="70" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{t('help.infographic.budgetFlow.plan')}</text>

      {/* Arrow Plan → Savings */}
      <line x1="130" y1="70" x2="170" y2="70" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowBF)" />

      {/* Savings box */}
      <rect x="170" y="20" width="120" height="50" rx="8" fill="#DC2626" opacity="0.85" />
      <text x="230" y="50" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.budgetFlow.savings')}</text>
      <text x="230" y="85" textAnchor="middle" fill="#DC2626" fontSize="10" fontWeight="500">− {t('help.infographic.budgetFlow.subtract')}</text>

      {/* Deferrals box */}
      <rect x="170" y="100" width="120" height="50" rx="8" fill="#16A34A" opacity="0.85" />
      <text x="230" y="130" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.budgetFlow.deferrals')}</text>
      <text x="230" y="165" textAnchor="middle" fill="#16A34A" fontSize="10" fontWeight="500">+ {t('help.infographic.budgetFlow.add')}</text>

      {/* Arrows to Computed */}
      <line x1="290" y1="45" x2="340" y2="70" stroke="#DC2626" strokeWidth="2" strokeDasharray="5,3" />
      <line x1="290" y1="125" x2="340" y2="70" stroke="#16A34A" strokeWidth="2" strokeDasharray="5,3" />

      {/* Computed box */}
      <rect x="340" y="40" width="140" height="60" rx="8" fill="var(--color-accent)" />
      <text x="410" y="68" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{t('help.infographic.budgetFlow.computed')}</text>
      <text x="410" y="85" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">Plan − Savings + Deferrals</text>

      {/* Arrow Computed → Committed */}
      <line x1="480" y1="70" x2="520" y2="70" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowBF)" />

      {/* Committed box */}
      <rect x="520" y="40" width="120" height="60" rx="8" fill="#F59E0B" opacity="0.9" />
      <text x="580" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.budgetFlow.committed')}</text>

      {/* Arrow Committed → Real */}
      <line x1="640" y1="70" x2="680" y2="70" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowBF)" />

      {/* Real box */}
      <rect x="680" y="40" width="110" height="60" rx="8" fill="#16A34A" />
      <text x="735" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{t('help.infographic.budgetFlow.real')}</text>

      {/* Compare bracket */}
      <path d="M410,110 L410,200 L735,200 L735,110" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="4,4" />
      <text x="572" y="225" textAnchor="middle" fill="var(--color-accent)" fontSize="11" fontWeight="600">↕ {t('help.infographic.budgetFlow.compare')}</text>

      {/* Formula bar */}
      <rect x="200" y="240" width="400" height="30" rx="6" fill="var(--color-sidebar)" opacity="0.9" />
      <text x="400" y="260" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{t('help.infographic.budgetFlow.formula')}</text>

      <defs>
        <marker id="arrowBF" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="var(--color-accent)" />
        </marker>
      </defs>
    </svg>
  );
}
