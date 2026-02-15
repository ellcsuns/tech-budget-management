import { useState, useEffect } from 'react';
import { reportApi, financialCompanyApi } from '../services/api';
import { useActiveBudget } from '../contexts/ActiveBudgetContext';
import { REPORT_DEFINITIONS } from '../config/reportDefinitions';
import type { ReportDefinition } from '../config/reportDefinitions';

export default function DetailedReportsPage() {
  const { activeBudget } = useActiveBudget();
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    financialCompanyApi.getAll().then(res => setCompanies(res.data));
  }, []);

  const runReport = async () => {
    if (!selectedReport || !activeBudget) return;
    setLoading(true);
    try {
      const res = await reportApi.get(selectedReport.id, { budgetId: activeBudget.id, ...filters });
      setData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al generar reporte');
    } finally { setLoading(false); }
  };

  const exportExcel = async () => {
    if (!data || !selectedReport) return;
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data.rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedReport.name.substring(0, 31));
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `reporte_${selectedReport.id}_${date}.xlsx`);
    } catch {
      alert('Error al exportar. Asegúrese de que la librería xlsx está instalada.');
    }
  };

  const getFilterOptions = (filterKey: string, filterDef: any) => {
    if (filterKey === 'financialCompanyId') {
      return companies.map(c => ({ value: c.id, label: c.name }));
    }
    return filterDef.options || [];
  };

  const formatCell = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    if (type === 'currency') return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
    if (type === 'percentage') return typeof value === 'number' ? `${value.toFixed(1)}%` : value;
    if (type === 'number') return typeof value === 'number' ? value.toLocaleString() : value;
    return String(value);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Reportes Detallados</h1>
      {activeBudget && (
        <p className="text-sm text-gray-500">Presupuesto: {activeBudget.year} {activeBudget.version}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {REPORT_DEFINITIONS.map(r => (
          <button key={r.id} onClick={() => { setSelectedReport(r); setData(null); setFilters({}); }}
            className={`p-3 rounded-lg border text-left transition-all ${selectedReport?.id === r.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400 bg-white'}`}>
            <p className="text-sm font-medium">{r.name}</p>
            <p className="text-xs text-gray-500 mt-1">{r.description}</p>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold">{selectedReport.name}</h2>

          {selectedReport.filters.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              {selectedReport.filters.map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <select value={filters[f.key] || ''} onChange={e => setFilters({...filters, [f.key]: e.target.value})}
                    className="px-3 py-2 border rounded-lg min-w-[150px]">
                    <option value="">Todos</option>
                    {getFilterOptions(f.key, f).map((o: any) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={runReport} disabled={loading || !activeBudget}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
            {data && data.rows.length > 0 && (
              <button onClick={exportExcel} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Descargar Excel
              </button>
            )}
          </div>

          {data && (
            data.rows.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No se encontraron resultados para los filtros seleccionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {selectedReport.columns.map(c => (
                        <th key={c.key} className={`p-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        {selectedReport.columns.map(c => (
                          <td key={c.key} className={`p-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                            {formatCell(row[c.key], c.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
