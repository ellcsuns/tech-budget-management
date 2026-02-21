export interface ReportFilter {
  key: string;
  labelKey: string;
  type: 'select' | 'monthRange';
  options?: { value: string; labelKey: string }[];
}

export interface ReportColumn {
  key: string;
  labelKey: string;
  type: 'text' | 'number' | 'currency' | 'percentage';
  align?: 'left' | 'right' | 'center';
}

export interface ReportDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'executive-summary',
    nameKey: 'report.executiveSummary',
    descriptionKey: 'reportDef.executiveSummary.desc',
    filters: [],
    columns: [
      { key: 'indicator', labelKey: 'reportDef.col.indicator', type: 'text', align: 'left' },
      { key: 'value', labelKey: 'reportDef.col.value', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'budget-execution',
    nameKey: 'report.budgetExecution',
    descriptionKey: 'reportDef.budgetExecution.desc',
    filters: [
      { key: 'financialCompanyId', labelKey: 'reportDef.filter.financialCompany', type: 'select' }
    ],
    columns: [
      { key: 'code', labelKey: 'reportDef.col.code', type: 'text' },
      { key: 'description', labelKey: 'reportDef.col.description', type: 'text' },
      { key: 'company', labelKey: 'reportDef.col.company', type: 'text' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'committed', labelKey: 'reportDef.col.committed', type: 'currency', align: 'right' },
      { key: 'real', labelKey: 'reportDef.col.real', type: 'currency', align: 'right' },
      { key: 'balance', labelKey: 'reportDef.col.balance', type: 'currency', align: 'right' },
      { key: 'executionPct', labelKey: 'reportDef.col.executionPct', type: 'percentage', align: 'right' },
    ]
  },
  {
    id: 'plan-vs-real',
    nameKey: 'report.planVsReal',
    descriptionKey: 'reportDef.planVsReal.desc',
    filters: [
      { key: 'monthFrom', labelKey: 'reportDef.filter.monthFrom', type: 'select', options: monthOptions() },
      { key: 'monthTo', labelKey: 'reportDef.filter.monthTo', type: 'select', options: monthOptions() },
    ],
    columns: [
      { key: 'month', labelKey: 'reportDef.col.month', type: 'text' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'committed', labelKey: 'reportDef.col.committed', type: 'currency', align: 'right' },
      { key: 'real', labelKey: 'reportDef.col.real', type: 'currency', align: 'right' },
      { key: 'difference', labelKey: 'reportDef.col.difference', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'by-financial-company',
    nameKey: 'report.byFinancialCompany',
    descriptionKey: 'reportDef.byFinancialCompany.desc',
    filters: [],
    columns: [
      { key: 'name', labelKey: 'reportDef.col.company', type: 'text' },
      { key: 'count', labelKey: 'reportDef.col.expenses', type: 'number', align: 'right' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'committed', labelKey: 'reportDef.col.committed', type: 'currency', align: 'right' },
      { key: 'real', labelKey: 'reportDef.col.real', type: 'currency', align: 'right' },
      { key: 'pctTotal', labelKey: 'reportDef.col.pctTotal', type: 'percentage', align: 'right' },
    ]
  },
  {
    id: 'by-tech-direction',
    nameKey: 'report.byTechDirection',
    descriptionKey: 'reportDef.byTechDirection.desc',
    filters: [],
    columns: [
      { key: 'name', labelKey: 'reportDef.col.direction', type: 'text' },
      { key: 'count', labelKey: 'reportDef.col.expenses', type: 'number', align: 'right' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'committed', labelKey: 'reportDef.col.committed', type: 'currency', align: 'right' },
      { key: 'real', labelKey: 'reportDef.col.real', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'by-user-area',
    nameKey: 'report.byUserArea',
    descriptionKey: 'reportDef.byUserArea.desc',
    filters: [],
    columns: [
      { key: 'name', labelKey: 'reportDef.col.area', type: 'text' },
      { key: 'count', labelKey: 'reportDef.col.expenses', type: 'number', align: 'right' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'committed', labelKey: 'reportDef.col.committed', type: 'currency', align: 'right' },
      { key: 'real', labelKey: 'reportDef.col.real', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'detailed-transactions',
    nameKey: 'report.detailedTransactions',
    descriptionKey: 'reportDef.detailedTransactions.desc',
    filters: [
      { key: 'type', labelKey: 'reportDef.filter.type', type: 'select', options: [
        { value: 'COMMITTED', labelKey: 'reportDef.filter.committed' },
        { value: 'REAL', labelKey: 'reportDef.filter.real' },
      ]},
      { key: 'monthFrom', labelKey: 'reportDef.filter.monthFrom', type: 'select', options: monthOptions() },
      { key: 'monthTo', labelKey: 'reportDef.filter.monthTo', type: 'select', options: monthOptions() },
    ],
    columns: [
      { key: 'month', labelKey: 'reportDef.col.month', type: 'text' },
      { key: 'type', labelKey: 'reportDef.col.type', type: 'text' },
      { key: 'expense', labelKey: 'reportDef.col.expense', type: 'text' },
      { key: 'company', labelKey: 'reportDef.col.company', type: 'text' },
      { key: 'reference', labelKey: 'reportDef.col.reference', type: 'text' },
      { key: 'currency', labelKey: 'reportDef.col.currency', type: 'text' },
      { key: 'originalValue', labelKey: 'reportDef.col.originalValue', type: 'currency', align: 'right' },
      { key: 'usdValue', labelKey: 'reportDef.col.usdValue', type: 'currency', align: 'right' },
      { key: 'serviceDate', labelKey: 'reportDef.col.date', type: 'text' },
    ]
  },
  {
    id: 'variance-analysis',
    nameKey: 'report.varianceAnalysis',
    descriptionKey: 'reportDef.varianceAnalysis.desc',
    filters: [],
    columns: [
      { key: 'code', labelKey: 'reportDef.col.code', type: 'text' },
      { key: 'description', labelKey: 'reportDef.col.description', type: 'text' },
      { key: 'company', labelKey: 'reportDef.col.company', type: 'text' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'actual', labelKey: 'reportDef.col.executed', type: 'currency', align: 'right' },
      { key: 'variance', labelKey: 'reportDef.col.variance', type: 'currency', align: 'right' },
      { key: 'variancePct', labelKey: 'reportDef.col.variancePct', type: 'percentage', align: 'right' },
      { key: 'status', labelKey: 'reportDef.col.status', type: 'text' },
    ]
  },
  {
    id: 'savings-deferrals',
    nameKey: 'report.savingsDeferrals',
    descriptionKey: 'reportDef.savingsDeferrals.desc',
    filters: [],
    columns: [
      { key: 'type', labelKey: 'reportDef.col.type', type: 'text' },
      { key: 'expense', labelKey: 'reportDef.col.expense', type: 'text' },
      { key: 'description', labelKey: 'reportDef.col.description', type: 'text' },
      { key: 'amount', labelKey: 'reportDef.col.amountUsd', type: 'currency', align: 'right' },
      { key: 'status', labelKey: 'reportDef.col.status', type: 'text' },
      { key: 'period', labelKey: 'reportDef.col.period', type: 'text' },
      { key: 'createdBy', labelKey: 'reportDef.col.createdBy', type: 'text' },
      { key: 'date', labelKey: 'reportDef.col.date', type: 'text' },
    ]
  },
  {
    id: 'annual-projection',
    nameKey: 'report.annualProjection',
    descriptionKey: 'reportDef.annualProjection.desc',
    filters: [],
    columns: [
      { key: 'month', labelKey: 'reportDef.col.month', type: 'text' },
      { key: 'plan', labelKey: 'reportDef.col.planUsd', type: 'currency', align: 'right' },
      { key: 'actual', labelKey: 'reportDef.col.realUsd', type: 'currency', align: 'right' },
      { key: 'projected', labelKey: 'reportDef.col.projected', type: 'currency', align: 'right' },
      { key: 'cumPlan', labelKey: 'reportDef.col.cumPlan', type: 'currency', align: 'right' },
      { key: 'cumActual', labelKey: 'reportDef.col.cumActual', type: 'currency', align: 'right' },
    ]
  },
];

function monthOptions() {
  return [1,2,3,4,5,6,7,8,9,10,11,12]
    .map((m) => ({ value: String(m), labelKey: `month.short.${m}` }));
}
