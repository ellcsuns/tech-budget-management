interface InfographicProps { t: (key: string) => string; }

export default function TransactionFlowInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 700 260" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.transactionFlow.title')}>
      {/* Title */}
      <text x="350" y="20" textAnchor="middle" fill="var(--color-sidebar)" fontSize="14" fontWeight="700">{t('help.infographic.transactionFlow.title')}</text>

      {/* Committed Transaction */}
      <rect x="30" y="50" width="180" height="70" rx="10" fill="#F59E0B" opacity="0.9" />
      <text x="120" y="80" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.transactionFlow.committed')}</text>
      <text x="120" y="100" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">$10,000</text>

      {/* Arrow → Full Compensation */}
      <line x1="210" y1="85" x2="270" y2="85" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowTF)" />

      {/* Real Transaction (Full) */}
      <rect x="270" y="50" width="160" height="70" rx="10" fill="#16A34A" />
      <text x="350" y="80" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.transactionFlow.real')}</text>
      <text x="350" y="100" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">$10,000</text>

      {/* Full compensation label */}
      <rect x="460" y="60" width="200" height="50" rx="8" fill="var(--color-accent)" opacity="0.15" stroke="var(--color-accent)" strokeWidth="1.5" />
      <text x="560" y="82" textAnchor="middle" fill="var(--color-accent)" fontSize="11" fontWeight="600">✓ {t('help.infographic.transactionFlow.full')}</text>
      <text x="560" y="100" textAnchor="middle" fill="var(--color-accent)" fontSize="10">$10,000 → $10,000</text>
      <line x1="430" y1="85" x2="460" y2="85" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="4,3" />

      {/* Partial Compensation Section */}
      {/* Committed */}
      <rect x="30" y="160" width="180" height="70" rx="10" fill="#F59E0B" opacity="0.9" />
      <text x="120" y="190" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.transactionFlow.committed')}</text>
      <text x="120" y="210" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">$10,000</text>

      {/* Arrow → Partial */}
      <line x1="210" y1="195" x2="270" y2="195" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowTF)" />

      {/* Real (Partial) */}
      <rect x="270" y="160" width="160" height="70" rx="10" fill="#16A34A" opacity="0.7" />
      <text x="350" y="190" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.transactionFlow.real')}</text>
      <text x="350" y="210" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">$6,000</text>

      {/* Partial label + remaining */}
      <rect x="460" y="150" width="200" height="35" rx="8" fill="#F59E0B" opacity="0.12" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="560" y="173" textAnchor="middle" fill="#F59E0B" fontSize="11" fontWeight="600">⚡ {t('help.infographic.transactionFlow.partial')}</text>
      <line x1="430" y1="175" x2="460" y2="170" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,3" />

      <rect x="460" y="195" width="200" height="35" rx="8" fill="#DC2626" opacity="0.1" stroke="#DC2626" strokeWidth="1.5" />
      <text x="560" y="218" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="600">{t('help.infographic.transactionFlow.remaining')}: $4,000</text>
      <line x1="430" y1="205" x2="460" y2="210" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="4,3" />

      <defs>
        <marker id="arrowTF" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="var(--color-accent)" />
        </marker>
      </defs>
    </svg>
  );
}
