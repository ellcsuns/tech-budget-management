interface InfographicProps { t: (key: string) => string; }

export default function DashboardInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 700 280" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.dashboard.title')}>
      {/* Title */}
      <text x="350" y="22" textAnchor="middle" fill="var(--color-sidebar)" fontSize="14" fontWeight="700">{t('help.infographic.dashboard.title')}</text>

      {/* KPI Cards Row */}
      <text x="350" y="48" textAnchor="middle" fill="var(--color-accent)" fontSize="11" fontWeight="600">{t('help.infographic.dashboard.kpis')}</text>

      {/* KPI 1 - Budget */}
      <rect x="30" y="58" width="150" height="55" rx="8" fill="var(--color-primary)" opacity="0.12" stroke="var(--color-primary)" strokeWidth="1" />
      <text x="105" y="78" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.budget')}</text>
      <text x="105" y="100" textAnchor="middle" fill="var(--color-primary)" fontSize="16" fontWeight="700">$1.2M</text>

      {/* KPI 2 - Committed */}
      <rect x="195" y="58" width="150" height="55" rx="8" fill="#F59E0B" opacity="0.12" stroke="#F59E0B" strokeWidth="1" />
      <text x="270" y="78" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.committed')}</text>
      <text x="270" y="100" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="700">$800K</text>

      {/* KPI 3 - Real */}
      <rect x="360" y="58" width="150" height="55" rx="8" fill="#16A34A" opacity="0.12" stroke="#16A34A" strokeWidth="1" />
      <text x="435" y="78" textAnchor="middle" fill="#16A34A" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.real')}</text>
      <text x="435" y="100" textAnchor="middle" fill="#16A34A" fontSize="16" fontWeight="700">$650K</text>

      {/* KPI 4 - Difference */}
      <rect x="525" y="58" width="150" height="55" rx="8" fill="var(--color-accent)" opacity="0.12" stroke="var(--color-accent)" strokeWidth="1" />
      <text x="600" y="78" textAnchor="middle" fill="var(--color-accent)" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.difference')}</text>
      <text x="600" y="100" textAnchor="middle" fill="var(--color-accent)" fontSize="16" fontWeight="700">$550K</text>

      {/* Charts section label */}
      <text x="350" y="140" textAnchor="middle" fill="var(--color-accent)" fontSize="11" fontWeight="600">{t('help.infographic.dashboard.charts')}</text>

      {/* Chart 1 - By Category (pie) */}
      <rect x="30" y="150" width="200" height="110" rx="8" fill="white" stroke="var(--color-accent)" strokeWidth="1" opacity="0.8" />
      <text x="130" y="170" textAnchor="middle" fill="var(--color-sidebar)" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.byCategory')}</text>
      <circle cx="100" cy="220" r="30" fill="none" stroke="var(--color-primary)" strokeWidth="15" strokeDasharray="47 141" />
      <circle cx="100" cy="220" r="30" fill="none" stroke="#F59E0B" strokeWidth="15" strokeDasharray="47 141" strokeDashoffset="-47" />
      <circle cx="100" cy="220" r="30" fill="none" stroke="#16A34A" strokeWidth="15" strokeDasharray="47 141" strokeDashoffset="-94" />
      <rect x="155" y="195" width="8" height="8" rx="2" fill="var(--color-primary)" />
      <text x="168" y="203" fill="var(--color-sidebar)" fontSize="8">IT</text>
      <rect x="155" y="210" width="8" height="8" rx="2" fill="#F59E0B" />
      <text x="168" y="218" fill="var(--color-sidebar)" fontSize="8">Ops</text>
      <rect x="155" y="225" width="8" height="8" rx="2" fill="#16A34A" />
      <text x="168" y="233" fill="var(--color-sidebar)" fontSize="8">HR</text>

      {/* Chart 2 - Trends (bar) */}
      <rect x="250" y="150" width="420" height="110" rx="8" fill="white" stroke="var(--color-accent)" strokeWidth="1" opacity="0.8" />
      <text x="460" y="170" textAnchor="middle" fill="var(--color-sidebar)" fontSize="10" fontWeight="600">{t('help.infographic.dashboard.trends')}</text>
      {/* Bars */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const x = 275 + i * 32;
        const bh = 20 + Math.sin(i * 0.8) * 15 + 30;
        const ch = bh * 0.7;
        const rh = bh * 0.5;
        return (
          <g key={i}>
            <rect x={x} y={250 - bh} width="8" height={bh} rx="2" fill="var(--color-primary)" opacity="0.6" />
            <rect x={x + 9} y={250 - ch} width="8" height={ch} rx="2" fill="#F59E0B" opacity="0.6" />
            <rect x={x + 18} y={250 - rh} width="8" height={rh} rx="2" fill="#16A34A" opacity="0.6" />
            <text x={x + 13} y="262" textAnchor="middle" fill="var(--color-sidebar)" fontSize="7">M{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
