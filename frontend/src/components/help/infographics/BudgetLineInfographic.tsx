interface InfographicProps { t: (key: string) => string; }

export default function BudgetLineInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 750 160" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.budgetLine.title')}>
      {/* Title */}
      <text x="375" y="20" textAnchor="middle" fill="var(--color-sidebar)" fontSize="13" fontWeight="700">{t('help.infographic.budgetLine.title')}</text>

      {/* Expense box */}
      <rect x="10" y="40" width="100" height="50" rx="8" fill="var(--color-primary)" />
      <text x="60" y="60" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{t('help.infographic.budgetLine.expense')}</text>
      <text x="60" y="78" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">IT-001</text>

      {/* Company box */}
      <rect x="120" y="40" width="100" height="50" rx="8" fill="var(--color-accent)" />
      <text x="170" y="60" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{t('help.infographic.budgetLine.company')}</text>
      <text x="170" y="78" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">Corp A</text>

      {/* Currency box */}
      <rect x="230" y="40" width="70" height="50" rx="8" fill="#F59E0B" />
      <text x="265" y="60" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{t('help.infographic.budgetLine.currency')}</text>
      <text x="265" y="78" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">USD</text>

      {/* Monthly values */}
      <rect x="315" y="35" width="390" height="60" rx="8" fill="#16A34A" opacity="0.1" stroke="#16A34A" strokeWidth="1" />
      <text x="510" y="52" textAnchor="middle" fill="#16A34A" fontSize="10" fontWeight="600">{t('help.infographic.budgetLine.months')}</text>
      {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
        const x = 322 + (m - 1) * 32;
        return (
          <g key={m}>
            <rect x={x} y="58" width="28" height="28" rx="4" fill="#16A34A" opacity="0.2" />
            <text x={x + 14} y="76" textAnchor="middle" fill="#166534" fontSize="8" fontWeight="500">M{m}</text>
          </g>
        );
      })}

      {/* Total */}
      <rect x="715" y="40" width="30" height="50" rx="6" fill="var(--color-sidebar)" />
      <text x="730" y="60" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Σ</text>
      <text x="730" y="78" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="6">{t('help.infographic.budgetLine.total')}</text>

      {/* Connecting lines */}
      <line x1="110" y1="65" x2="120" y2="65" stroke="var(--color-accent)" strokeWidth="1.5" />
      <line x1="220" y1="65" x2="230" y2="65" stroke="var(--color-accent)" strokeWidth="1.5" />
      <line x1="300" y1="65" x2="315" y2="65" stroke="var(--color-accent)" strokeWidth="1.5" />
      <line x1="705" y1="65" x2="715" y2="65" stroke="var(--color-accent)" strokeWidth="1.5" />

      {/* Legend */}
      <text x="375" y="120" textAnchor="middle" fill="var(--color-sidebar)" fontSize="9" opacity="0.7">
        {t('help.infographic.budgetLine.expense')} + {t('help.infographic.budgetLine.company')} + {t('help.infographic.budgetLine.currency')} → M1...M12 → {t('help.infographic.budgetLine.total')}
      </text>
    </svg>
  );
}
