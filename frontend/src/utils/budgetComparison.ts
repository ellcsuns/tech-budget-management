export interface ComparisonSummary {
  totalA: number;
  totalB: number;
  difference: number;
  percentChange: number;
  newExpenses: number;
  removedExpenses: number;
  modifiedExpenses: number;
}

export interface ComparisonRow {
  expenseCode: string;
  expenseDescription: string;
  companyName: string;
  status: 'new' | 'removed' | 'modified' | 'unchanged';
  monthlyA: number[];
  monthlyB: number[];
  totalA: number;
  totalB: number;
  difference: number;
  percentChange: number;
}

export function calculateSummary(rows: ComparisonRow[]): ComparisonSummary {
  const totalA = rows.reduce((s, r) => s + r.totalA, 0);
  const totalB = rows.reduce((s, r) => s + r.totalB, 0);
  return {
    totalA, totalB,
    difference: totalB - totalA,
    percentChange: totalA !== 0 ? ((totalB - totalA) / totalA) * 100 : 0,
    newExpenses: rows.filter(r => r.status === 'new').length,
    removedExpenses: rows.filter(r => r.status === 'removed').length,
    modifiedExpenses: rows.filter(r => r.status === 'modified').length,
  };
}

function getBudgetLineKey(bl: any): string {
  return `${bl.expense?.code || bl.expenseId}-${bl.financialCompanyId}`;
}

function getMonthlyFromBudgetLine(bl: any): number[] {
  if (!bl) return Array(12).fill(0);
  const vals = Array(12).fill(0);
  for (let m = 1; m <= 12; m++) {
    vals[m - 1] = Number(bl[`planM${m}`]) || 0;
  }
  return vals;
}

export function classifyExpenses(budgetA: any, budgetB: any): ComparisonRow[] {
  const linesA = budgetA.budgetLines || budgetA.expenses || [];
  const linesB = budgetB.budgetLines || budgetB.expenses || [];

  // Build maps by key
  const mapA = new Map<string, any>();
  const mapB = new Map<string, any>();

  for (const bl of linesA) {
    const key = bl.expense?.code ? getBudgetLineKey(bl) : bl.code;
    mapA.set(key, bl);
  }
  for (const bl of linesB) {
    const key = bl.expense?.code ? getBudgetLineKey(bl) : bl.code;
    mapB.set(key, bl);
  }

  const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
  const rows: ComparisonRow[] = [];

  for (const key of allKeys) {
    const a = mapA.get(key);
    const b = mapB.get(key);

    const monthlyA = a ? (a.planM1 !== undefined ? getMonthlyFromBudgetLine(a) : getMonthlyFromPlanValues(a)) : Array(12).fill(0);
    const monthlyB = b ? (b.planM1 !== undefined ? getMonthlyFromBudgetLine(b) : getMonthlyFromPlanValues(b)) : Array(12).fill(0);
    const totalA = monthlyA.reduce((s, v) => s + v, 0);
    const totalB = monthlyB.reduce((s, v) => s + v, 0);

    let status: ComparisonRow['status'] = 'unchanged';
    if (!a) status = 'new';
    else if (!b) status = 'removed';
    else if (totalA !== totalB || monthlyA.some((v, i) => v !== monthlyB[i])) status = 'modified';

    const desc = (b || a);
    rows.push({
      expenseCode: desc?.expense?.code || desc?.code || (key as string),
      expenseDescription: desc?.expense?.shortDescription || desc?.shortDescription || '',
      companyName: desc?.financialCompany?.name || '',
      status, monthlyA, monthlyB, totalA, totalB,
      difference: totalB - totalA,
      percentChange: totalA !== 0 ? ((totalB - totalA) / totalA) * 100 : 0
    });
  }
  return rows;
}

function getMonthlyFromPlanValues(expense: any): number[] {
  if (!expense) return Array(12).fill(0);
  const vals = Array(12).fill(0);
  for (const pv of (expense.planValues || [])) {
    if (pv.month >= 1 && pv.month <= 12) vals[pv.month - 1] = Number(pv.usdValue || pv.transactionValue);
  }
  return vals;
}

export function getDifferenceColor(diff: number): string {
  if (diff > 0) return 'text-green-600 bg-green-50';
  if (diff < 0) return 'text-red-600 bg-red-50';
  return '';
}

export function generateDifferenceDescription(rows: ComparisonRow[], budgetA: any, budgetB: any): string {
  const lines: string[] = [];
  lines.push(`Comparación: ${budgetA.year} ${budgetA.version} vs ${budgetB.version}`);
  const summary = calculateSummary(rows);
  lines.push(`Total A: ${summary.totalA.toLocaleString()} | Total B: ${summary.totalB.toLocaleString()} | Diferencia: ${summary.difference.toLocaleString()} (${summary.percentChange.toFixed(1)}%)`);
  if (summary.newExpenses > 0) lines.push(`Líneas nuevas: ${summary.newExpenses}`);
  if (summary.removedExpenses > 0) lines.push(`Líneas eliminadas: ${summary.removedExpenses}`);
  lines.push('');
  for (const r of rows.filter(r => r.status !== 'unchanged')) {
    const label = r.status === 'new' ? '[NUEVO]' : r.status === 'removed' ? '[ELIMINADO]' : '[MODIFICADO]';
    lines.push(`${label} ${r.expenseCode} - ${r.expenseDescription}: ${r.totalA.toLocaleString()} → ${r.totalB.toLocaleString()} (${r.difference >= 0 ? '+' : ''}${r.difference.toLocaleString()})`);
  }
  return lines.join('\n');
}
