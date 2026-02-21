import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { BudgetLine, ExpenseWithTags, Saving } from '../types';
import { expensesEnhancedApi } from '../services/api';
import { fmt } from '../utils/formatters';
import ExpenseDetailPopup from './ExpenseDetailPopup';
import BudgetLineDetailPopup from './BudgetLineDetailPopup';
import { useI18n } from '../contexts/I18nContext';

interface ExpenseTableProps {
  budgetLines: BudgetLine[];
  viewMode: 'PLAN' | 'COMPARISON';
  filters: any;
  readOnly?: boolean;
  onTotalsChange?: (totals: { budget: number; committed: number; real: number; diff: number }) => void;
  activeSavings?: Saving[];
}

type SortField = 'code' | 'description' | 'total' | `month-${number}`;
type SortDir = 'asc' | 'desc';

export default function ExpenseTable({ budgetLines, viewMode, filters, readOnly = false, onTotalsChange, activeSavings = [] }: ExpenseTableProps) {
  const { t } = useI18n();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithTags | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);
  const [showBudgetLineDetail, setShowBudgetLineDetail] = useState(false);
  const [descWidth, setDescWidth] = useState(180);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const handleExpenseClick = async (expenseId: string) => {
    try {
      const res = await expensesEnhancedApi.getById(expenseId);
      setSelectedExpense(res.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Error loading expense:', error);
    }
  };

  const handleCloseDetail = () => { setShowDetail(false); setSelectedExpense(null); };

  const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

  const getPlanValue = (bl: BudgetLine, month: number): number => {
    const key = `planM${month}` as keyof BudgetLine;
    return Number(bl[key]) || 0;
  };

  const getPlanTotal = (bl: BudgetLine): number => {
    let total = 0;
    for (let m = 1; m <= 12; m++) total += getPlanValue(bl, m);
    return total;
  };

  const getMonthlyValues = (bl: BudgetLine) => {
    const lineSavings = activeSavings.filter(s => s.budgetLineId === bl.id);
    const lineDeferrals = bl.deferrals || [];
    const values: any[] = [];
    for (let month = 1; month <= 12; month++) {
      const originalBudget = getPlanValue(bl, month);
      let savingAmount = 0;
      lineSavings.forEach(s => {
        savingAmount += Number((s as any)[`savingM${month}`]) || 0;
      });
      const budget = originalBudget - savingAmount;
      const hasSaving = savingAmount > 0;
      // Check if any deferral covers this month
      const hasDeferral = lineDeferrals.some(d => month >= d.startMonth && month <= d.endMonth);
      const committedTxns = bl.transactions?.filter(t => t.month === month && t.type === 'COMMITTED' && !t.isCompensated) || [];
      const realTxns = bl.transactions?.filter(t => t.month === month && t.type === 'REAL') || [];
      values.push({
        month,
        budget,
        originalBudget,
        savingAmount,
        hasSaving,
        hasDeferral,
        committed: committedTxns.reduce((sum, t) => sum + Number(t.transactionValue), 0),
        real: realTxns.reduce((sum, t) => sum + Number(t.transactionValue), 0)
      });
    }
    return values;
  };

  const calcTotal = (values: any[], type: 'budget' | 'committed' | 'real') => values.reduce((s, v) => s + (v[type] || 0), 0);

  const filteredLines = useMemo(() => budgetLines.filter(bl => {
    if (filters.searchText && filters.searchText.trim()) {
      const search = filters.searchText.toLowerCase();
      const matchCode = bl.expense?.code?.toLowerCase().includes(search);
      const matchDesc = bl.expense?.shortDescription?.toLowerCase().includes(search);
      if (!matchCode && !matchDesc) return false;
    }
    if (filters.currencies && filters.currencies.length > 0) {
      if (!filters.currencies.includes(bl.currency)) return false;
    }
    if (filters.financialCompanyIds && filters.financialCompanyIds.length > 0) {
      if (!filters.financialCompanyIds.includes(bl.financialCompanyId)) return false;
    }
    return true;
  }), [budgetLines, filters]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const sortedLines = useMemo(() => {
    if (!sortField) return filteredLines;
    return [...filteredLines].sort((a, b) => {
      let va: any, vb: any;
      if (sortField === 'code') { va = a.expense?.code || ''; vb = b.expense?.code || ''; }
      else if (sortField === 'description') { va = a.expense?.shortDescription || ''; vb = b.expense?.shortDescription || ''; }
      else if (sortField === 'total') { va = getPlanTotal(a); vb = getPlanTotal(b); }
      else if (sortField.startsWith('month-')) {
        const m = parseInt(sortField.split('-')[1]);
        va = getPlanValue(a, m); vb = getPlanValue(b, m);
      }
      if (typeof va === 'string') { const cmp = va.localeCompare(vb); return sortDir === 'asc' ? cmp : -cmp; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [filteredLines, sortField, sortDir]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = descWidth;
    const onMove = (ev: MouseEvent) => { if (resizing.current) setDescWidth(Math.max(100, startW.current + ev.clientX - startX.current)); };
    const onUp = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [descWidth]);

  const grandTotals = useMemo(() => {
    let budget = 0, committed = 0, real = 0;
    filteredLines.forEach(bl => {
      const mv = getMonthlyValues(bl);
      budget += calcTotal(mv, 'budget');
      committed += calcTotal(mv, 'committed');
      real += calcTotal(mv, 'real');
    });
    const diff = budget - (committed + real);
    return { budget, committed, real, diff };
  }, [filteredLines]);

  React.useEffect(() => {
    if (onTotalsChange) onTotalsChange(grandTotals);
  }, [grandTotals]);

  const monthlyGrandTotals = useMemo(() => {
    const totals: any[] = [];
    for (let month = 1; month <= 12; month++) {
      let budget = 0, committed = 0, real = 0;
      filteredLines.forEach(bl => {
        const mv = getMonthlyValues(bl);
        const v = mv.find(x => x.month === month);
        if (v) { budget += v.budget; committed += v.committed; real += v.real; }
      });
      totals.push({ month, budget, committed, real });
    }
    return totals;
  }, [filteredLines]);

  const onlyBudgetVisible = filters.visibleColumns?.budget && !filters.visibleColumns?.committed && !filters.visibleColumns?.real;
  const getDiffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-400';
    if (onlyBudgetVisible) return diff >= 0 ? 'text-red-600' : 'text-green-600';
    return diff < 0 ? 'text-red-600' : 'text-green-600';
  };

  if (viewMode === 'PLAN') {
    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('code')}>{t('table.code')}{sortIcon('code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none relative" style={{ width: descWidth, minWidth: 100 }} onClick={() => toggleSort('description')}>
                  {t('table.description')}{sortIcon('description')}
                  <span className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent" onMouseDown={onMouseDown} />
                </th>
                {months.map((month, i) => (
                  <th key={month} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort(`month-${i + 1}`)}>
                    {month}{sortIcon(`month-${i + 1}`)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('total')}>{t('table.total')}{sortIcon('total')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLines.map((bl) => {
                const total = getPlanTotal(bl);
                return (
                  <tr key={bl.id} onClick={() => handleExpenseClick(bl.expenseId)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm text-gray-900">{bl.expense?.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900" style={{ width: descWidth, maxWidth: descWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bl.expense?.shortDescription}</td>
                    {months.map((_, i) => {
                      const val = getPlanValue(bl, i + 1);
                      return <td key={i} className="px-4 py-3 text-sm text-right text-gray-900">{val > 0 ? fmt(val) : ''}</td>;
                    })}
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={2}>{t('table.total')}</td>
                {monthlyGrandTotals.map(t => (
                  <td key={t.month} className="px-4 py-3 text-sm text-right">{fmt(t.budget)}</td>
                ))}
                <td className="px-4 py-3 text-sm text-right">{fmt(grandTotals.budget)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {showDetail && selectedExpense && (
          <ExpenseDetailPopup expense={selectedExpense} onClose={handleCloseDetail} readOnly={readOnly}
            onUpdate={() => { if (selectedExpense) handleExpenseClick(selectedExpense.id); }} />
        )}
      </>
    );
  }

  // COMPARISON view
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 cursor-pointer select-none relative" style={{ width: descWidth, minWidth: 100 }} onClick={() => toggleSort('description')}>
                {t('table.description')}{sortIcon('description')}
                <span className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent" onMouseDown={onMouseDown} />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.currency')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.company')}</th>
              {months.map((month) => (
                <th key={month} colSpan={[filters.visibleColumns.budget, filters.visibleColumns.committed, filters.visibleColumns.real, true].filter(Boolean).length} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l">
                  {month}
                </th>
              ))}
              <th colSpan={[filters.visibleColumns.budget, filters.visibleColumns.committed, filters.visibleColumns.real, true].filter(Boolean).length} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l">{t('table.total')}</th>
            </tr>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10"></th>
              <th></th>
              <th></th>
              {months.map((month) => (
                <React.Fragment key={month}>
                  {filters.visibleColumns.budget && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.budget')}</th>}
                  {filters.visibleColumns.committed && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.committed')}</th>}
                  {filters.visibleColumns.real && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.real')}</th>}
                  <th className="px-2 py-2 text-xs text-gray-500">{t('expense.diff')}</th>
                </React.Fragment>
              ))}
              <React.Fragment>
                {filters.visibleColumns.budget && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.budget')}</th>}
                {filters.visibleColumns.committed && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.committed')}</th>}
                {filters.visibleColumns.real && <th className="px-2 py-2 text-xs text-gray-500">{t('expense.real')}</th>}
                <th className="px-2 py-2 text-xs text-gray-500">{t('expense.diff')}</th>
              </React.Fragment>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLines.map((bl) => {
              const monthlyValues = getMonthlyValues(bl);
              const totalBudget = calcTotal(monthlyValues, 'budget');
              const totalCommitted = calcTotal(monthlyValues, 'committed');
              const totalReal = calcTotal(monthlyValues, 'real');
              return (
                <tr key={bl.id} onClick={() => { setSelectedBudgetLine(bl); setShowBudgetLineDetail(true); }} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10" style={{ width: descWidth, maxWidth: descWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bl.expense?.shortDescription}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{bl.currency}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{bl.financialCompany?.code || '-'}</td>
                  {monthlyValues.map((value) => (
                    <React.Fragment key={value.month}>
                      {filters.visibleColumns.budget && (
                        <td className={`px-2 py-3 text-sm text-right ${value.hasSaving ? 'text-gray-900' : 'text-gray-900'}`} title={value.hasSaving ? `Original: ${fmt(value.originalBudget)} | Ahorro: ${fmt(value.savingAmount)}` : undefined}>
                          <span className="inline-flex items-center gap-1 justify-end">
                            {value.hasSaving && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title={`Ahorro: ${fmt(value.savingAmount)}`} />}
                            {value.budget > 0 ? fmt(value.budget) : '-'}
                          </span>
                        </td>
                      )}
                      {filters.visibleColumns.committed && <td className="px-2 py-3 text-sm text-right text-blue-600">{value.committed > 0 ? fmt(value.committed) : '-'}</td>}
                      {filters.visibleColumns.real && (
                        <td className="px-2 py-3 text-sm text-right text-green-600">
                          <span className="inline-flex items-center gap-1 justify-end">
                            {value.hasDeferral && value.real > 0 && <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" title="Diferido" />}
                            {value.real > 0 ? fmt(value.real) : '-'}
                          </span>
                        </td>
                      )}
                      {(() => { const diff = value.budget - (value.committed + value.real); return <td className={`px-2 py-3 text-sm text-right font-medium ${getDiffColor(diff)}`}>{diff !== 0 ? fmt(diff) : '-'}</td>; })()}
                    </React.Fragment>
                  ))}
                  <React.Fragment>
                    {filters.visibleColumns.budget && <td className="px-2 py-3 text-sm text-right font-semibold text-gray-900 border-l">{totalBudget > 0 ? fmt(totalBudget) : '-'}</td>}
                    {filters.visibleColumns.committed && <td className="px-2 py-3 text-sm text-right font-semibold text-blue-600">{totalCommitted > 0 ? fmt(totalCommitted) : '-'}</td>}
                    {filters.visibleColumns.real && <td className="px-2 py-3 text-sm text-right font-semibold text-green-600">{totalReal > 0 ? fmt(totalReal) : '-'}</td>}
                    {(() => { const totalDiff = totalBudget - (totalCommitted + totalReal); return <td className={`px-2 py-3 text-sm text-right font-semibold ${getDiffColor(totalDiff)}`}>{totalDiff !== 0 ? fmt(totalDiff) : '-'}</td>; })()}
                  </React.Fragment>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-bold">
            <tr>
              <td className="px-4 py-3 text-sm sticky left-0 bg-gray-100 z-10">{t('table.total')}</td>
              <td></td>
              <td></td>
              {monthlyGrandTotals.map(t => {
                const diff = t.budget - (t.committed + t.real);
                return (
                  <React.Fragment key={t.month}>
                    {filters.visibleColumns.budget && <td className="px-2 py-3 text-sm text-right">{fmt(t.budget)}</td>}
                    {filters.visibleColumns.committed && <td className="px-2 py-3 text-sm text-right text-blue-600">{fmt(t.committed)}</td>}
                    {filters.visibleColumns.real && <td className="px-2 py-3 text-sm text-right text-green-600">{fmt(t.real)}</td>}
                    <td className={`px-2 py-3 text-sm text-right ${getDiffColor(diff)}`}>{fmt(diff)}</td>
                  </React.Fragment>
                );
              })}
              <React.Fragment>
                {filters.visibleColumns.budget && <td className="px-2 py-3 text-sm text-right border-l">{fmt(grandTotals.budget)}</td>}
                {filters.visibleColumns.committed && <td className="px-2 py-3 text-sm text-right text-blue-600">{fmt(grandTotals.committed)}</td>}
                {filters.visibleColumns.real && <td className="px-2 py-3 text-sm text-right text-green-600">{fmt(grandTotals.real)}</td>}
                <td className={`px-2 py-3 text-sm text-right ${getDiffColor(grandTotals.diff)}`}>{fmt(grandTotals.diff)}</td>
              </React.Fragment>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Ahorro aplicado</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" /> Diferido</span>
      </div>
      {showBudgetLineDetail && selectedBudgetLine && (
        <BudgetLineDetailPopup budgetLine={selectedBudgetLine} activeSavings={activeSavings} onClose={() => { setShowBudgetLineDetail(false); setSelectedBudgetLine(null); }} />
      )}
    </>
  );
}
