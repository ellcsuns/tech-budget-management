import { useState } from 'react';
import type { Expense, ExpenseWithTags } from '../types';
import { expensesEnhancedApi } from '../services/api';
import ExpenseDetailPopup from './ExpenseDetailPopup';

interface ExpenseTableProps {
  expenses: Expense[];
  viewMode: 'PLAN' | 'COMPARISON';
  filters: any;
}

export default function ExpenseTable({ expenses, viewMode, filters }: ExpenseTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithTags | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleExpenseClick = async (expenseId: string) => {
    try {
      const res = await expensesEnhancedApi.getById(expenseId);
      setSelectedExpense(res.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Error loading expense:', error);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedExpense(null);
  };

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getMonthlyValues = (expense: Expense) => {
    const values: any[] = [];
    for (let month = 1; month <= 12; month++) {
      const planValue = expense.planValues?.find(pv => pv.month === month);
      const committedTransactions = expense.transactions?.filter(t => t.month === month && t.type === 'COMMITTED');
      const realTransactions = expense.transactions?.filter(t => t.month === month && t.type === 'REAL');

      values.push({
        month,
        budget: planValue ? Number(planValue.transactionValue) : 0,
        committed: committedTransactions?.reduce((sum, t) => sum + Number(t.transactionValue), 0) || 0,
        real: realTransactions?.reduce((sum, t) => sum + Number(t.transactionValue), 0) || 0
      });
    }
    return values;
  };

  const calculateTotal = (values: any[], type: 'budget' | 'committed' | 'real') => {
    return values.reduce((sum, v) => sum + (v[type] || 0), 0);
  };

  const filteredExpenses = expenses.filter(expense => {
    // Filter by currencies
    if (filters.currencies && filters.currencies.length > 0) {
      const hasCurrency = expense.planValues?.some(pv => filters.currencies.includes(pv.transactionCurrency)) ||
                         expense.transactions?.some(t => filters.currencies.includes(t.transactionCurrency));
      if (!hasCurrency) return false;
    }
    
    // Filter by financial companies
    if (filters.financialCompanyIds && filters.financialCompanyIds.length > 0) {
      if (!filters.financialCompanyIds.includes(expense.financialCompanyId)) {
        return false;
      }
    }
    
    return true;
  });

  if (viewMode === 'PLAN') {
    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                {months.map((month) => (
                  <th key={month} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {month}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => {
                const monthlyValues = getMonthlyValues(expense);
                const total = calculateTotal(monthlyValues, 'budget');

                return (
                  <tr
                    key={expense.id}
                    onClick={() => handleExpenseClick(expense.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.shortDescription}</td>
                    {monthlyValues.map((value) => (
                      <td key={value.month} className="px-4 py-3 text-sm text-right text-gray-900">
                        {value.budget > 0 ? value.budget.toLocaleString() : ''}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showDetail && selectedExpense && (
          <ExpenseDetailPopup
            expense={selectedExpense}
            onClose={handleCloseDetail}
            onUpdate={() => {
              // Reload expense after update
              if (selectedExpense) {
                handleExpenseClick(selectedExpense.id);
              }
            }}
          />
        )}
      </>
    );
  }

  // Vista comparativa
  return (
    <>
      <div className="overflow-x-auto">
        <div className="mb-4 flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.visibleColumns.budget}
              onChange={(e) => filters.onVisibleColumnsChange?.({ ...filters.visibleColumns, budget: e.target.checked })}
              className="mr-2"
            />
            Presupuesto
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.visibleColumns.committed}
              onChange={(e) => filters.onVisibleColumnsChange?.({ ...filters.visibleColumns, committed: e.target.checked })}
              className="mr-2"
            />
            Comprometido
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.visibleColumns.real}
              onChange={(e) => filters.onVisibleColumnsChange?.({ ...filters.visibleColumns, real: e.target.checked })}
              className="mr-2"
            />
            Real
          </label>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">Descripción</th>
              {months.map((month) => (
                <th key={month} colSpan={[filters.visibleColumns.budget, filters.visibleColumns.committed, filters.visibleColumns.real].filter(Boolean).length} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l">
                  {month}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l">Total</th>
            </tr>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10"></th>
              {months.map((month) => (
                <>
                  {filters.visibleColumns.budget && <th key={`${month}-b`} className="px-2 py-2 text-xs text-gray-500">Ppto</th>}
                  {filters.visibleColumns.committed && <th key={`${month}-c`} className="px-2 py-2 text-xs text-gray-500">Comp</th>}
                  {filters.visibleColumns.real && <th key={`${month}-r`} className="px-2 py-2 text-xs text-gray-500">Real</th>}
                </>
              ))}
              <>
                {filters.visibleColumns.budget && <th className="px-2 py-2 text-xs text-gray-500">Ppto</th>}
                {filters.visibleColumns.committed && <th className="px-2 py-2 text-xs text-gray-500">Comp</th>}
                {filters.visibleColumns.real && <th className="px-2 py-2 text-xs text-gray-500">Real</th>}
              </>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.map((expense) => {
              const monthlyValues = getMonthlyValues(expense);
              const totalBudget = calculateTotal(monthlyValues, 'budget');
              const totalCommitted = calculateTotal(monthlyValues, 'committed');
              const totalReal = calculateTotal(monthlyValues, 'real');

              return (
                <tr
                  key={expense.id}
                  onClick={() => handleExpenseClick(expense.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10">{expense.shortDescription}</td>
                  {monthlyValues.map((value) => (
                    <>
                      {filters.visibleColumns.budget && (
                        <td key={`${value.month}-b`} className="px-2 py-3 text-sm text-right text-gray-900">
                          {value.budget > 0 ? value.budget.toLocaleString() : '-'}
                        </td>
                      )}
                      {filters.visibleColumns.committed && (
                        <td key={`${value.month}-c`} className="px-2 py-3 text-sm text-right text-blue-600">
                          {value.committed > 0 ? value.committed.toLocaleString() : '-'}
                        </td>
                      )}
                      {filters.visibleColumns.real && (
                        <td key={`${value.month}-r`} className="px-2 py-3 text-sm text-right text-green-600">
                          {value.real > 0 ? value.real.toLocaleString() : '-'}
                        </td>
                      )}
                    </>
                  ))}
                  <>
                    {filters.visibleColumns.budget && (
                      <td className="px-2 py-3 text-sm text-right font-semibold text-gray-900 border-l">
                        {totalBudget > 0 ? totalBudget.toLocaleString() : '-'}
                      </td>
                    )}
                    {filters.visibleColumns.committed && (
                      <td className="px-2 py-3 text-sm text-right font-semibold text-blue-600">
                        {totalCommitted > 0 ? totalCommitted.toLocaleString() : '-'}
                      </td>
                    )}
                    {filters.visibleColumns.real && (
                      <td className="px-2 py-3 text-sm text-right font-semibold text-green-600">
                        {totalReal > 0 ? totalReal.toLocaleString() : '-'}
                      </td>
                    )}
                  </>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDetail && selectedExpense && (
        <ExpenseDetailPopup
          expense={selectedExpense}
          onClose={handleCloseDetail}
          onUpdate={() => {
            // Reload expense after update
            if (selectedExpense) {
              handleExpenseClick(selectedExpense.id);
            }
          }}
        />
      )}
    </>
  );
}
