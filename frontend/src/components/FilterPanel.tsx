import { useState, useEffect } from 'react';
import { financialCompanyApi } from '../services/api';
import type { Expense, FinancialCompany } from '../types';
import { HiOutlineXMark } from 'react-icons/hi2';

interface FilterPanelProps {
  expenses: Expense[];
  filters: {
    currencies?: string[];
    financialCompanyIds?: string[];
    searchText?: string;
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
    onFiltersChange({ currencies: undefined, financialCompanyIds: undefined, searchText: '', visibleColumns: { budget: true, committed: true, real: true } });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchText: value });
  };

  const accentOn = 'bg-accent text-white';
  const accentOff = 'bg-gray-200 text-gray-500';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search input */}
      <input
        type="text"
        value={filters.searchText || ''}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Buscar gasto..."
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-48"
      />

      <div className="w-px h-6 bg-gray-300" />

      {/* Column toggles */}
      <div className="flex items-center gap-1">
        <button onClick={() => toggleColumn('budget')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.budget ? accentOn : accentOff}`}>Ppto</button>
        <button onClick={() => toggleColumn('committed')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.committed ? accentOn : accentOff}`}>Comp</button>
        <button onClick={() => toggleColumn('real')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.real ? accentOn : accentOff}`}>Real</button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Currency filters */}
      {currencies.length > 0 && (
        <>
          <div className="flex items-center gap-1">
            {currencies.map(currency => (
              <button key={currency} onClick={() => toggleCurrency(currency)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.currencies?.includes(currency) ?? true) ? accentOn : accentOff}`}>{currency}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}

      {/* Financial company filters */}
      {financialCompanies.length > 0 && (
        <>
          <div className="flex items-center gap-1">
            {financialCompanies.map(company => (
              <button key={company.id} onClick={() => toggleFinancialCompany(company.id)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.financialCompanyIds?.includes(company.id) ?? true) ? accentOn : accentOff}`}>{company.name}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}

      {/* Clear filters icon button */}
      <button onClick={clearFilters} className="text-accent hover:opacity-70 transition-opacity ml-auto" title="Limpiar filtros">
        <HiOutlineXMark className="w-6 h-6" />
      </button>
    </div>
  );
}
