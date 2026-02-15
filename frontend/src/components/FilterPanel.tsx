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

  useEffect(() => { loadFinancialCompanies(); }, []);

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
    const current = filters.currencies || [];
    const next = current.includes(currency) ? current.filter(c => c !== currency) : [...current, currency];
    onFiltersChange({ ...filters, currencies: next.length > 0 ? next : undefined });
  };

  const toggleFinancialCompany = (companyId: string) => {
    const current = filters.financialCompanyIds || [];
    const next = current.includes(companyId) ? current.filter(c => c !== companyId) : [...current, companyId];
    onFiltersChange({ ...filters, financialCompanyIds: next.length > 0 ? next : undefined });
  };

  const toggleColumn = (column: 'budget' | 'committed' | 'real') => {
    onFiltersChange({ ...filters, visibleColumns: { ...filters.visibleColumns, [column]: !filters.visibleColumns[column] } });
  };

  const clearFilters = () => {
    onFiltersChange({ currencies: undefined, financialCompanyIds: undefined, visibleColumns: { budget: true, committed: true, real: true } });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Column toggles */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">Columnas:</span>
        <button onClick={() => toggleColumn('budget')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.budget ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Ppto</button>
        <button onClick={() => toggleColumn('committed')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.committed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Comp</button>
        <button onClick={() => toggleColumn('real')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.real ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Real</button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Currency filters */}
      {currencies.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Moneda:</span>
          {currencies.map(currency => (
            <button key={currency} onClick={() => toggleCurrency(currency)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.currencies?.includes(currency) ?? true) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{currency}</button>
          ))}
        </div>
      )}

      <div className="w-px h-6 bg-gray-300" />

      {/* Financial company filters */}
      {financialCompanies.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Empresa:</span>
          {financialCompanies.map(company => (
            <button key={company.id} onClick={() => toggleFinancialCompany(company.id)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.financialCompanyIds?.includes(company.id) ?? true) ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{company.name}</button>
          ))}
        </div>
      )}

      <button onClick={clearFilters} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 ml-auto">Limpiar</button>
    </div>
  );
}
