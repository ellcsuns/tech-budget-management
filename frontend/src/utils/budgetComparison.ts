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

export function classifyExpenses(budgetA: any, budgetB: any): ComparisonRow[] {
  const expA = budgetA.expenses || [];
  const expB = budgetB.expenses || [];
  const mapA = new Map(expA.map((e: any) => [e.code, e]));
  const mapB = new Map(expB.map((e: any) => [e.code, e]));
  const allCodes = new Set([...mapA.keys(), ...mapB.keys()]);
  const rows: ComparisonRow[] = [];

  for (const code of allCodes) {
    const a = mapA.get(code);
    const b = mapB.get(code);
    const monthlyA = getMonthlyValues(a);
    const monthlyB = getMonthlyValues(b);
    const totalA = monthlyA.reduce((s, v) => s + v, 0);
    const totalB = monthlyB.reduce((s, v) => s + v, 0);
    let status: ComparisonRow['status'] = 'unchanged';
    if (!a) status = 'new';
    else if (!b) status = 'removed';
    else if (totalA !== totalB || monthlyA.some((v, i) => v !== monthlyB[i])) status = 'modified';

    rows.push({
      expenseCode: code as string,
      expenseDescription: (b || a)?.shortDescription || '',
      status, monthlyA, monthlyB, totalA, totalB,
      difference: totalB - totalA,
      percentChange: totalA !== 0 ? ((totalB - totalA) / totalA) * 100 : 0
    });
  }
  return rows;
}

function getMonthlyValues(expense: any): number[] {
  if (!expense) return Array(12).fill(0);
  const vals = Array(12).fill(0);
  for (const pv of (expense.planValues || [])) {
    if (pv.month >= 1 && pv.month <= 12) vals[pv.month - 1] = Number(pv.usdValue);
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
  lines.push(`Total A: $${summary.totalA.toLocaleString()} | Total B: $${summary.totalB.toLocaleString()} | Diferencia: $${summary.difference.toLocaleString()} (${summary.percentChange.toFixed(1)}%)`);
  if (summary.newExpenses > 0) lines.push(`Gastos nuevos: ${summary.newExpenses}`);
  if (summary.removedExpenses > 0) lines.push(`Gastos eliminados: ${summary.removedExpenses}`);
  lines.push('');
  for (const r of rows.filter(r => r.status !== 'unchanged')) {
    const label = r.status === 'new' ? '[NUEVO]' : r.status === 'removed' ? '[ELIMINADO]' : '[MODIFICADO]';
    lines.push(`${label} ${r.expenseCode} - ${r.expenseDescription}: $${r.totalA.toLocaleString()} → $${r.totalB.toLocaleString()} (${r.difference >= 0 ? '+' : ''}$${r.difference.toLocaleString()})`);
  }
  return lines.join('\n');
}
