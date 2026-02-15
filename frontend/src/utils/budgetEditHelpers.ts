/**
 * Helper functions for budget editing
 */

import { Expense, ExpenseRow, PlanValue } from '../types';

/**
 * Generate a unique key for a budget cell
 * @param expenseId - The expense ID
 * @param month - The month (1-12)
 * @returns A unique key string
 */
export function getCellKey(expenseId: string, month: number): string {
  return `${expenseId}-${month}`;
}

/**
 * Validate a cell value
 * @param value - The value to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateCellValue(value: string): { isValid: boolean; error?: string } {
  // Empty values are treated as 0 (valid)
  if (value.trim() === '') {
    return { isValid: true };
  }

  // Check if numeric
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Value must be a number' };
  }

  // Check if non-negative
  if (numValue < 0) {
    return { isValid: false, error: 'Value must be greater than or equal to 0' };
  }

  return { isValid: true };
}

/**
 * Transform API expenses into ExpenseRow format with 12-month plan values
 * @param expenses - Array of expenses from API
 * @returns Array of ExpenseRow objects
 */
export function transformToExpenseRows(expenses: Expense[]): ExpenseRow[] {
  return expenses.map(expense => {
    // Ensure we have plan values for all 12 months
    const planValues: PlanValue[] = [];
    for (let month = 1; month <= 12; month++) {
      const existingPlanValue = expense.planValues?.find(pv => pv.month === month);
      if (existingPlanValue) {
        planValues.push(existingPlanValue);
      } else {
        // Create placeholder with zero values
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

/**
 * Calculate the total of all monthly values for an expense row
 * @param expenseRow - The expense row
 * @param editedCells - Map of edited cells
 * @returns Total value
 */
export function calculateTotal(expenseRow: ExpenseRow, editedCells: Map<string, any>): number {
  let total = 0;
  
  for (let month = 1; month <= 12; month++) {
    const cellKey = getCellKey(expenseRow.id, month);
    const editedCell = editedCells.get(cellKey);
    
    if (editedCell && editedCell.isValid) {
      total += editedCell.value;
    } else {
      const planValue = expenseRow.planValues.find(pv => pv.month === month);
      total += planValue?.transactionValue || 0;
    }
  }
  
  return total;
}


