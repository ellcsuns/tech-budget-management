interface InfographicProps { t: (key: string) => string; }

export default function RolesPermissionsInfographic({ t }: InfographicProps) {
  return (
    <svg viewBox="0 0 700 180" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t('help.infographic.rolesPermissions.users')}>
      {/* Users column */}
      <rect x="20" y="30" width="130" height="120" rx="10" fill="var(--color-primary)" opacity="0.15" stroke="var(--color-primary)" strokeWidth="1.5" />
      <text x="85" y="55" textAnchor="middle" fill="var(--color-primary)" fontSize="13" fontWeight="700">{t('help.infographic.rolesPermissions.users')}</text>
      <circle cx="55" cy="85" r="12" fill="var(--color-primary)" opacity="0.6" />
      <text x="55" y="89" textAnchor="middle" fill="white" fontSize="10">👤</text>
      <circle cx="85" cy="110" r="12" fill="var(--color-primary)" opacity="0.6" />
      <text x="85" y="114" textAnchor="middle" fill="white" fontSize="10">👤</text>
      <circle cx="115" cy="85" r="12" fill="var(--color-primary)" opacity="0.6" />
      <text x="115" y="89" textAnchor="middle" fill="white" fontSize="10">👤</text>

      {/* Arrow Users → Roles */}
      <line x1="150" y1="90" x2="195" y2="90" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowRP)" />
      <text x="172" y="82" textAnchor="middle" fill="var(--color-accent)" fontSize="9" fontWeight="500">{t('help.infographic.rolesPermissions.assign')}</text>

      {/* Roles column */}
      <rect x="195" y="30" width="130" height="120" rx="10" fill="var(--color-accent)" opacity="0.15" stroke="var(--color-accent)" strokeWidth="1.5" />
      <text x="260" y="55" textAnchor="middle" fill="var(--color-accent)" fontSize="13" fontWeight="700">{t('help.infographic.rolesPermissions.roles')}</text>
      <rect x="210" y="68" width="100" height="24" rx="5" fill="var(--color-accent)" opacity="0.7" />
      <text x="260" y="84" textAnchor="middle" fill="white" fontSize="10">Admin</text>
      <rect x="210" y="98" width="100" height="24" rx="5" fill="var(--color-accent)" opacity="0.7" />
      <text x="260" y="114" textAnchor="middle" fill="white" fontSize="10">Editor</text>

      {/* Arrow Roles → Permissions */}
      <line x1="325" y1="90" x2="370" y2="90" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowRPY)" />
      <text x="347" y="82" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="500">{t('help.infographic.rolesPermissions.define')}</text>

      {/* Permissions column */}
      <rect x="370" y="30" width="140" height="120" rx="10" fill="#F59E0B" opacity="0.12" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="440" y="55" textAnchor="middle" fill="#F59E0B" fontSize="13" fontWeight="700">{t('help.infographic.rolesPermissions.permissions')}</text>
      <text x="440" y="78" textAnchor="middle" fill="#92400E" fontSize="10">VIEW · MODIFY</text>
      <text x="440" y="96" textAnchor="middle" fill="#92400E" fontSize="10">VIEW_OWN · MODIFY_OWN</text>
      <text x="440" y="114" textAnchor="middle" fill="#92400E" fontSize="10">APPROVE_BUDGET</text>

      {/* Arrow Permissions → Modules */}
      <line x1="510" y1="90" x2="555" y2="90" stroke="#16A34A" strokeWidth="2" markerEnd="url(#arrowRPG)" />
      <text x="532" y="82" textAnchor="middle" fill="#16A34A" fontSize="9" fontWeight="500">{t('help.infographic.rolesPermissions.access')}</text>

      {/* Modules column */}
      <rect x="555" y="30" width="130" height="120" rx="10" fill="#16A34A" opacity="0.12" stroke="#16A34A" strokeWidth="1.5" />
      <text x="620" y="55" textAnchor="middle" fill="#16A34A" fontSize="13" fontWeight="700">{t('help.infographic.rolesPermissions.modules')}</text>
      <text x="620" y="78" textAnchor="middle" fill="#166534" fontSize="10">Dashboard</text>
      <text x="620" y="96" textAnchor="middle" fill="#166534" fontSize="10">Budgets</text>
      <text x="620" y="114" textAnchor="middle" fill="#166534" fontSize="10">Reports</text>
      <text x="620" y="132" textAnchor="middle" fill="#166534" fontSize="10">...</text>

      <defs>
        <marker id="arrowRP" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--color-accent)" /></marker>
        <marker id="arrowRPY" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#F59E0B" /></marker>
        <marker id="arrowRPG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#16A34A" /></marker>
      </defs>
    </svg>
  );
}
