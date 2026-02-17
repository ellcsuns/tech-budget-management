/**
 * Helper functions for budget editing (BudgetLine model)
 */

import { BudgetLine, BudgetLineRow, ExpenseRow, PlanValue } from '../types';

export function getCellKey(id: string, month: number): string {
  return `${id}-${month}`;
}

export function validateCellValue(value: string): { isValid: boolean; error?: string } {
  if (value.trim() === '') return { isValid: true };
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { isValid: false, error: 'Value must be a number' };
  if (numValue < 0) return { isValid: false, error: 'Value must be greater than or equal to 0' };
  return { isValid: true };
}

export function getPlanValue(bl: BudgetLine, month: number): number {
  const key = `planM${month}` as keyof BudgetLine;
  return Number(bl[key]) || 0;
}

/**
 * Transform BudgetLines into BudgetLineRow format
 */
export function transformToBudgetLineRows(budgetLines: BudgetLine[]): BudgetLineRow[] {
  return budgetLines.map(bl => {
    const planValues: { month: number; value: number }[] = [];
    for (let month = 1; month <= 12; month++) {
      planValues.push({ month, value: getPlanValue(bl, month) });
    }
    return {
      id: bl.id,
      expenseCode: bl.expense?.code || '',
      expenseDescription: bl.expense?.shortDescription || '',
      financialCompanyName: bl.financialCompany?.name || '',
      currency: bl.currency,
      planValues,
      isNew: false
    };
  });
}

/**
 * Legacy: Transform API expenses into ExpenseRow format (backward compat)
 */
export function transformToExpenseRows(expenses: any[]): ExpenseRow[] {
  return expenses.map(expense => {
    const planValues: PlanValue[] = [];
    for (let month = 1; month <= 12; month++) {
      const existingPlanValue = expense.planValues?.find((pv: any) => pv.month === month);
      if (existingPlanValue) {
        planValues.push(existingPlanValue);
      } else {
        planValues.push({
          id: `placeholder-${expense.id}-${month}`,
          expenseId: expense.id,
          month,
          transactionCurrency: 'USD',
          transactionValue: 0,
          usdValue: 0,
          conversionRate: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    return {
      id: expense.id,
      code: expense.code,
      description: expense.shortDescription,
      planValues,
      isNew: false
    };
  });
}

export function calculateTotal(expenseRow: ExpenseRow, editedCells: Map<string, any>): number {
  let total = 0;
  for (let month = 1; month <= 12; month++) {
    const cellKey = getCellKey(expenseRow.id, month);
    const editedCell = editedCells.get(cellKey);
    if (editedCell && editedCell.isValid) {
      total += editedCell.value;
    } else {
      const planValue = expenseRow.planValues.find(pv => pv.month === month);
      total += Number(planValue?.transactionValue) || 0;
    }
  }
  return total;
}

export function calculateBudgetLineTotal(bl: BudgetLine, editedCells: Map<string, any>): number {
  let total = 0;
  for (let month = 1; month <= 12; month++) {
    const cellKey = getCellKey(bl.id, month);
    const editedCell = editedCells.get(cellKey);
    if (editedCell) {
      total += editedCell.value;
    } else {
      total += getPlanValue(bl, month);
    }
  }
  return total;
}
