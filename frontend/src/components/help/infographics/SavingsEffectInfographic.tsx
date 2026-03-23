interface InfographicProps { t: (key: string) => string; }

export default function SavingsEffectInfographic({ t }: InfographicProps) {
  const baseValues = [100, 100, 100, 100, 100, 100];
  const savingValues = [0, 0, 20, 20, 20, 20];
  const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
  const maxH = 90;
  const barW = 35;

  return (
    <svg viewBox="0 0 700 240" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.savingsEffect.title')}>
      {/* Title */}
      <text x="350" y="22" textAnchor="middle" fill="var(--color-sidebar)" fontSize="14" fontWeight="700">{t('help.infographic.savingsEffect.title')}</text>

      {/* Before section */}
      <text x="175" y="48" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="600">{t('help.infographic.savingsEffect.before')}</text>
      {months.map((m, i) => {
        const x = 30 + i * 55;
        const h = (baseValues[i] / 100) * maxH;
        return (
          <g key={`before-${i}`}>
            <rect x={x} y={190 - h} width={barW} height={h} rx="4" fill="var(--color-primary)" opacity="0.7" />
            <text x={x + barW / 2} y={185 - h} textAnchor="middle" fill="var(--color-primary)" fontSize="9" fontWeight="500">${baseValues[i]}</text>
            <text x={x + barW / 2} y="205" textAnchor="middle" fill="var(--color-sidebar)" fontSize="9">{m}</text>
          </g>
        );
      })}
      <text x="175" y="225" textAnchor="middle" fill="var(--color-primary)" fontSize="10">{t('help.infographic.savingsEffect.base')}</text>

      {/* Divider */}
      <line x1="355" y1="40" x2="355" y2="220" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="4,4" />
      <text x="355" y="235" textAnchor="middle" fill="var(--color-accent)" fontSize="18">→</text>

      {/* After section */}
      <text x="530" y="48" textAnchor="middle" fill="#16A34A" fontSize="11" fontWeight="600">{t('help.infographic.savingsEffect.after')}</text>
      {months.map((m, i) => {
        const x = 385 + i * 55;
        const computed = baseValues[i] - savingValues[i];
        const hBase = (baseValues[i] / 100) * maxH;
        const hComputed = (computed / 100) * maxH;
        const hSaving = hBase - hComputed;
        return (
          <g key={`after-${i}`}>
            {/* Computed (green) */}
            <rect x={x} y={190 - hComputed} width={barW} height={hComputed} rx="4" fill="#16A34A" opacity="0.7" />
            {/* Saving portion (red striped) */}
            {hSaving > 0 && (
              <>
                <rect x={x} y={190 - hBase} width={barW} height={hSaving} rx="4" fill="#DC2626" opacity="0.25" />
                <line x1={x + 5} y1={190 - hBase + 5} x2={x + barW - 5} y2={190 - hComputed - 5} stroke="#DC2626" strokeWidth="1" opacity="0.5" />
              </>
            )}
            <text x={x + barW / 2} y={185 - hBase} textAnchor="middle" fill={hSaving > 0 ? '#DC2626' : '#16A34A'} fontSize="9" fontWeight="500">${computed}</text>
            <text x={x + barW / 2} y="205" textAnchor="middle" fill="var(--color-sidebar)" fontSize="9">{m}</text>
          </g>
        );
      })}
      <text x="530" y="225" textAnchor="middle" fill="#16A34A" fontSize="10">{t('help.infographic.savingsEffect.computed')}</text>

      {/* Legend */}
      <rect x="420" y="55" width="10" height="10" rx="2" fill="#DC2626" opacity="0.3" />
      <text x="435" y="64" fill="#DC2626" fontSize="9">{t('help.infographic.savingsEffect.reduction')}</text>
    </svg>
  );
}
