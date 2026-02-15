export interface ReportFilter {
  key: string;
  label: string;
  type: 'select' | 'monthRange';
  options?: { value: string; label: string }[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage';
  align?: 'left' | 'right' | 'center';
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'executive-summary',
    name: 'Resumen Ejecutivo',
    description: 'Vista general del presupuesto con indicadores clave de ejecución',
    filters: [],
    columns: [
      { key: 'indicator', label: 'Indicador', type: 'text', align: 'left' },
      { key: 'value', label: 'Valor', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'budget-execution',
    name: 'Ejecución Presupuestaria',
    description: 'Detalle de ejecución por cada gasto del presupuesto',
    filters: [
      { key: 'financialCompanyId', label: 'Empresa Financiera', type: 'select' }
    ],
    columns: [
      { key: 'code', label: 'Código', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'committed', label: 'Comprometido', type: 'currency', align: 'right' },
      { key: 'real', label: 'Real', type: 'currency', align: 'right' },
      { key: 'balance', label: 'Saldo', type: 'currency', align: 'right' },
      { key: 'executionPct', label: '% Ejec.', type: 'percentage', align: 'right' },
    ]
  },
  {
    id: 'plan-vs-real',
    name: 'Plan vs Real por Mes',
    description: 'Comparación mensual entre valores planificados y ejecutados',
    filters: [
      { key: 'monthFrom', label: 'Mes Desde', type: 'select', options: months() },
      { key: 'monthTo', label: 'Mes Hasta', type: 'select', options: months() },
    ],
    columns: [
      { key: 'month', label: 'Mes', type: 'text' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'committed', label: 'Comprometido', type: 'currency', align: 'right' },
      { key: 'real', label: 'Real', type: 'currency', align: 'right' },
      { key: 'difference', label: 'Diferencia', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'by-financial-company',
    name: 'Por Empresa Financiera',
    description: 'Agrupación de gastos y ejecución por empresa financiera',
    filters: [],
    columns: [
      { key: 'name', label: 'Empresa', type: 'text' },
      { key: 'count', label: 'Gastos', type: 'number', align: 'right' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'committed', label: 'Comprometido', type: 'currency', align: 'right' },
      { key: 'real', label: 'Real', type: 'currency', align: 'right' },
      { key: 'pctTotal', label: '% del Total', type: 'percentage', align: 'right' },
    ]
  },
  {
    id: 'by-tech-direction',
    name: 'Por Dirección Tecnológica',
    description: 'Distribución de presupuesto por dirección tecnológica',
    filters: [],
    columns: [
      { key: 'name', label: 'Dirección', type: 'text' },
      { key: 'count', label: 'Gastos', type: 'number', align: 'right' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'committed', label: 'Comprometido', type: 'currency', align: 'right' },
      { key: 'real', label: 'Real', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'by-user-area',
    name: 'Por Área Usuaria',
    description: 'Distribución de presupuesto por área usuaria',
    filters: [],
    columns: [
      { key: 'name', label: 'Área', type: 'text' },
      { key: 'count', label: 'Gastos', type: 'number', align: 'right' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'committed', label: 'Comprometido', type: 'currency', align: 'right' },
      { key: 'real', label: 'Real', type: 'currency', align: 'right' },
    ]
  },
  {
    id: 'detailed-transactions',
    name: 'Transacciones Detalladas',
    description: 'Listado completo de transacciones con filtros por tipo y período',
    filters: [
      { key: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'COMMITTED', label: 'Comprometidas' },
        { value: 'REAL', label: 'Reales' },
      ]},
      { key: 'monthFrom', label: 'Mes Desde', type: 'select', options: months() },
      { key: 'monthTo', label: 'Mes Hasta', type: 'select', options: months() },
    ],
    columns: [
      { key: 'month', label: 'Mes', type: 'text' },
      { key: 'type', label: 'Tipo', type: 'text' },
      { key: 'expense', label: 'Gasto', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
      { key: 'reference', label: 'Referencia', type: 'text' },
      { key: 'currency', label: 'Moneda', type: 'text' },
      { key: 'originalValue', label: 'Valor Original', type: 'currency', align: 'right' },
      { key: 'usdValue', label: 'Valor USD', type: 'currency', align: 'right' },
      { key: 'serviceDate', label: 'Fecha', type: 'text' },
    ]
  },
  {
    id: 'variance-analysis',
    name: 'Análisis de Variaciones',
    description: 'Identificación de gastos con mayor desviación respecto al plan',
    filters: [],
    columns: [
      { key: 'code', label: 'Código', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'actual', label: 'Ejecutado', type: 'currency', align: 'right' },
      { key: 'variance', label: 'Variación', type: 'currency', align: 'right' },
      { key: 'variancePct', label: 'Var. %', type: 'percentage', align: 'right' },
      { key: 'status', label: 'Estado', type: 'text' },
    ]
  },
  {
    id: 'savings-deferrals',
    name: 'Ahorros y Diferidos',
    description: 'Reporte consolidado de ahorros y diferidos del presupuesto',
    filters: [],
    columns: [
      { key: 'type', label: 'Tipo', type: 'text' },
      { key: 'expense', label: 'Gasto', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'text' },
      { key: 'amount', label: 'Monto USD', type: 'currency', align: 'right' },
      { key: 'status', label: 'Estado', type: 'text' },
      { key: 'period', label: 'Período', type: 'text' },
      { key: 'createdBy', label: 'Creado por', type: 'text' },
      { key: 'date', label: 'Fecha', type: 'text' },
    ]
  },
  {
    id: 'annual-projection',
    name: 'Proyección Anual',
    description: 'Proyección de cierre anual basada en ejecución actual',
    filters: [],
    columns: [
      { key: 'month', label: 'Mes', type: 'text' },
      { key: 'plan', label: 'Plan USD', type: 'currency', align: 'right' },
      { key: 'actual', label: 'Real USD', type: 'currency', align: 'right' },
      { key: 'projected', label: 'Proyectado', type: 'currency', align: 'right' },
      { key: 'cumPlan', label: 'Acum. Plan', type: 'currency', align: 'right' },
      { key: 'cumActual', label: 'Acum. Real/Proy', type: 'currency', align: 'right' },
    ]
  },
];

function months() {
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    .map((m, i) => ({ value: String(i + 1), label: m }));
}
