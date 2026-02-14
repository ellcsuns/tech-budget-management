import { useState, useEffect } from 'react';
import { financialCompanyApi } from '../services/api';
import type { Expense, FinancialCompany } from '../types';

interface FilterPanelProps {
  expenses: Expense[];
  filters: {
    currencies?: string[];
    financialCompanyIds?: string[];
    visibleColumns: {
      budget: boolean;
      committed: boolean;
      real: boolean;
    };
  };
  onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({ expenses, filters, onFiltersChange }: FilterPanelProps) {
  const [financialCompanies, setFinancialCompanies] = useState<FinancialCompany[]>([]);

  useEffect(() => {
    loadFinancialCompanies();
  }, []);

  const loadFinancialCompanies = async () => {
    try {
      const response = await financialCompanyApi.getAll();
      setFinancialCompanies(response.data);
    } catch (error) {
      console.error('Error loading financial companies:', error);
    }
  };

  const currencies = Array.from(new Set(
    expenses.flatMap(e => [
      ...(e.planValues?.map(pv => pv.transactionCurrency) || []),
      ...(e.transactions?.map(t => t.transactionCurrency) || [])
    ])
  ));

  const toggleCurrency = (currency: string) => {
    const currentCurrencies = filters.currencies || [];
    const newCurrencies = currentCurrencies.includes(currency)
      ? currentCurrencies.filter(c => c !== currency)
      : [...currentCurrencies, currency];
    
    onFiltersChange({
      ...filters,
      currencies: newCurrencies.length > 0 ? newCurrencies : undefined
    });
  };

  const toggleFinancialCompany = (companyId: string) => {
    const currentCompanies = filters.financialCompanyIds || [];
    const newCompanies = currentCompanies.includes(companyId)
      ? currentCompanies.filter(c => c !== companyId)
      : [...currentCompanies, companyId];
    
    onFiltersChange({
      ...filters,
      financialCompanyIds: newCompanies.length > 0 ? newCompanies : undefined
    });
  };

  const toggleColumn = (column: 'budget' | 'committed' | 'real') => {
    onFiltersChange({
      ...filters,
      visibleColumns: {
        ...filters.visibleColumns,
        [column]: !filters.visibleColumns[column]
      }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      currencies: undefined,
      financialCompanyIds: undefined,
      visibleColumns: {
        budget: true,
        committed: true,
        real: true
      }
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Visible Columns */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Columnas Visibles
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => toggleColumn('budget')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filters.visibleColumns.budget
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Budget (Plan)
          </button>
          <button
            onClick={() => toggleColumn('committed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filters.visibleColumns.committed
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Comprometido
          </button>
          <button
            onClick={() => toggleColumn('real')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filters.visibleColumns.real
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Real
          </button>
        </div>
      </div>

      {/* Currency Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monedas
        </label>
        <div className="flex flex-wrap gap-2">
          {currencies.map(currency => {
            const isActive = filters.currencies?.includes(currency) ?? true;
            return (
              <button
                key={currency}
                onClick={() => toggleCurrency(currency)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {currency}
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Company Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Empresas Financieras
        </label>
        <div className="flex flex-wrap gap-2">
          {financialCompanies.map(company => {
            const isActive = filters.financialCompanyIds?.includes(company.id) ?? true;
            return (
              <button
                key={company.id}
                onClick={() => toggleFinancialCompany(company.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {company.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="flex justify-end">
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
        >
          Limpiar Todos los Filtros
        </button>
      </div>
    </div>
  );
}
