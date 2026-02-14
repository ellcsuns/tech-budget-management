import { useState, useEffect } from 'react';
import { financialCompanyApi } from '../services/api';
import type { Expense, FinancialCompany } from '../types';

interface FilterPanelProps {
  expenses: Expense[];
  filters: any;
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

  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
        <select
          value={filters.currency || ''}
          onChange={(e) => onFiltersChange({ ...filters, currency: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas</option>
          {currencies.map(currency => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">Empresa Financiera</label>
        <select
          value={filters.financialCompanyId || ''}
          onChange={(e) => onFiltersChange({ ...filters, financialCompanyId: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas</option>
          {financialCompanies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={() => onFiltersChange({ ...filters, currency: undefined, financialCompanyId: undefined })}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
