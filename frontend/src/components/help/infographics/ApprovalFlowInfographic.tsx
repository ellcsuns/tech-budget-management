interface InfographicProps { t: (key: string) => string; }

export default function ApprovalFlowInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 700 200" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.approvalFlow.request')}>
      {/* Request box */}
      <rect x="20" y="60" width="140" height="60" rx="10" fill="var(--color-primary)" />
      <text x="90" y="95" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{t('help.infographic.approvalFlow.request')}</text>

      {/* Arrow → Pending */}
      <line x1="160" y1="90" x2="200" y2="90" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowAF)" />

      {/* Pending box */}
      <rect x="200" y="60" width="120" height="60" rx="10" fill="#F59E0B" />
      <text x="260" y="88" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.approvalFlow.pending')}</text>
      <text x="260" y="105" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">⏳</text>

      {/* Arrow → Review */}
      <line x1="320" y1="90" x2="360" y2="90" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowAF)" />

      {/* Review box */}
      <rect x="360" y="60" width="120" height="60" rx="10" fill="var(--color-accent)" />
      <text x="420" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{t('help.infographic.approvalFlow.review')}</text>

      {/* Arrow → Approved (top) */}
      <line x1="480" y1="75" x2="540" y2="40" stroke="#16A34A" strokeWidth="2" markerEnd="url(#arrowAFG)" />

      {/* Approved box */}
      <rect x="540" y="10" width="140" height="55" rx="10" fill="#16A34A" />
      <text x="610" y="35" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">✓ {t('help.infographic.approvalFlow.approved')}</text>
      <text x="610" y="52" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">{t('help.infographic.approvalFlow.applied')}</text>

      {/* Arrow → Rejected (bottom) */}
      <line x1="480" y1="105" x2="540" y2="140" stroke="#DC2626" strokeWidth="2" markerEnd="url(#arrowAFR)" />

      {/* Rejected box */}
      <rect x="540" y="115" width="140" height="55" rx="10" fill="#DC2626" opacity="0.9" />
      <text x="610" y="148" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">✗ {t('help.infographic.approvalFlow.rejected')}</text>

      <defs>
        <marker id="arrowAF" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="var(--color-accent)" />
        </marker>
        <marker id="arrowAFG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#16A34A" />
        </marker>
        <marker id="arrowAFR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="#DC2626" />
        </marker>
      </defs>
    </svg>
  );
}
