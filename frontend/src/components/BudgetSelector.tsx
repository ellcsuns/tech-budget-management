import { Budget } from '../types';

interface BudgetSelectorProps {
  budgets: Budget[];
  selectedBudgetId: string | null;
  onSelect: (budgetId: string) => void;
}

export default function BudgetSelector({ budgets, selectedBudgetId, onSelect }: BudgetSelectorProps) {
  return (
    <div className="mb-6">
      <label htmlFor="budget-select" className="block text-sm font-medium text-gray-700 mb-2">
        Seleccionar Presupuesto
      </label>
      <select
        id="budget-select"
        value={selectedBudgetId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        <option value="">-- Seleccione un presupuesto --</option>
        {budgets.map((budget) => (
          <option key={budget.id} value={budget.id}>
            {budget.year} - {budget.version}{budget.isActive ? ' ★ Vigente' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
