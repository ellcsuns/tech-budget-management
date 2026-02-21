import React from 'react';
import type { BudgetLine, Saving } from '../types';
import { fmt } from '../utils/formatters';
import { useI18n } from '../contexts/I18nContext';

interface BudgetLineDetailPopupProps {
  budgetLine: BudgetLine;
  activeSavings: Saving[];
  onClose: () => void;
}

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export interface MonthlyBreakdown {
  month: string;
  budget: number;
  committed: number;
  real: number;
  diff: number;
}

export function calcMonthlyBreakdown(budgetLine: BudgetLine, activeSavings: Saving[]): MonthlyBreakdown[] {
  const lineSavings = activeSavings.filter(s => s.budgetLineId === budgetLine.id);
  const result: MonthlyBreakdown[] = [];

  for (let m = 1; m <= 12; m++) {
    const planVal = Number((budgetLine as any)[`planM${m}`]) || 0;
    let savingAmount = 0;
    lineSavings.forEach(s => {
      savingAmount += Number((s as any)[`savingM${m}`]) || 0;
    });
    const budget = planVal - savingAmount;

    const committedTxns = budgetLine.transactions?.filter(t => t.month === m && t.type === 'COMMITTED' && !t.isCompensated) || [];
    const realTxns = budgetLine.transactions?.filter(t => t.month === m && t.type === 'REAL') || [];
    const committed = committedTxns.reduce((sum, t) => sum + Number(t.transactionValue), 0);
    const real = realTxns.reduce((sum, t) => sum + Number(t.transactionValue), 0);

    result.push({
      month: MONTHS[m - 1],
      budget,
      committed,
      real,
      diff: budget - committed - real
    });
  }
  return result;
}

export function calcTotals(breakdown: MonthlyBreakdown[]) {
  return breakdown.reduce(
    (acc, row) => ({
      budget: acc.budget + row.budget,
      committed: acc.committed + row.committed,
      real: acc.real + row.real,
      diff: acc.diff + row.diff
    }),
    { budget: 0, committed: 0, real: 0, diff: 0 }
  );
}

export default function BudgetLineDetailPopup({ budgetLine, activeSavings, onClose }: BudgetLineDetailPopupProps) {
  const { t } = useI18n();
  const breakdown = calcMonthlyBreakdown(budgetLine, activeSavings);
  const totals = calcTotals(breakdown);

  const getDiffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-400';
    return diff < 0 ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {budgetLine.expense?.code} — {budgetLine.expense?.shortDescription}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">{t('label.currency')}:</span>{' '}
              <span className="font-medium">{budgetLine.currency || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">{t('label.company')}:</span>{' '}
              <span className="font-medium">{budgetLine.financialCompany?.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">{t('label.category')}:</span>{' '}
              <span className="font-medium">{(budgetLine.expense as any)?.category?.name || '-'}</span>
            </div>
          </div>

          {/* Monthly breakdown table - vertical */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('label.month')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('expense.budget')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('expense.committed')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('expense.real')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('expense.diff')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {breakdown.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">{row.month}</td>
                    <td className="px-4 py-2 text-right">{fmt(row.budget)}</td>
                    <td className="px-4 py-2 text-right text-blue-600">{row.committed > 0 ? fmt(row.committed) : '-'}</td>
                    <td className="px-4 py-2 text-right text-green-600">{row.real > 0 ? fmt(row.real) : '-'}</td>
                    <td className={`px-4 py-2 text-right font-medium ${getDiffColor(row.diff)}`}>{fmt(row.diff)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="px-4 py-2">{t('table.total')}</td>
                  <td className="px-4 py-2 text-right">{fmt(totals.budget)}</td>
                  <td className="px-4 py-2 text-right text-blue-600">{fmt(totals.committed)}</td>
                  <td className="px-4 py-2 text-right text-green-600">{fmt(totals.real)}</td>
                  <td className={`px-4 py-2 text-right ${getDiffColor(totals.diff)}`}>{fmt(totals.diff)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
