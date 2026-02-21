import { useState, useEffect } from 'react';
import { reportApi, financialCompanyApi } from '../services/api';
import { useActiveBudget } from '../contexts/ActiveBudgetContext';
import { REPORT_DEFINITIONS } from '../config/reportDefinitions';
import type { ReportDefinition } from '../config/reportDefinitions';
import { showToast } from '../components/Toast';
import { useI18n } from '../contexts/I18nContext';

export default function DetailedReportsPage() {
  const { t } = useI18n();
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
      showToast(err.response?.data?.error || t('detailedReport.errorGenerating'), 'error');
    } finally { setLoading(false); }
  };

  const exportExcel = () => {
    if (!data || !selectedReport) return;
    const headers = selectedReport.columns.map(c => t(c.labelKey));
    const csvRows = [headers.join(',')];
    for (const row of data.rows) {
      const vals = selectedReport.columns.map(c => {
        const v = row[c.key];
        const str = v === null || v === undefined ? '' : String(v);
        return str.includes(',') ? `"${str}"` : str;
      });
      csvRows.push(vals.join(','));
    }
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `reporte_${selectedReport.id}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilterOptions = (filterKey: string, filterDef: any) => {
    if (filterKey === 'financialCompanyId') {
      return companies.map(c => ({ value: c.id, labelKey: c.name }));
    }
    return filterDef.options || [];
  };

  const formatCell = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    if (type === 'currency') return typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
    if (type === 'percentage') return typeof value === 'number' ? `${value.toFixed(1)}%` : value;
    if (type === 'number') return typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
    return String(value);
  };

  return (
    <div className="space-y-6">

      {activeBudget && (
        <p className="text-sm text-gray-500">{t('detailedReport.budgetLabel')} {activeBudget.year} {activeBudget.version}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {REPORT_DEFINITIONS.map(r => (
          <button key={r.id} onClick={() => { setSelectedReport(r); setData(null); setFilters({}); }}
            className={`p-3 rounded-lg border text-left transition-all ${selectedReport?.id === r.id ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400 bg-white'}`}>
            <p className="text-sm font-medium">{t(r.nameKey)}</p>
            <p className="text-xs text-gray-500 mt-1">{t(r.descriptionKey)}</p>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold">{t(selectedReport.nameKey)}</h2>

          {selectedReport.filters.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              {selectedReport.filters.map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600 mb-1">{t(f.labelKey)}</label>
                  <select value={filters[f.key] || ''} onChange={e => setFilters({...filters, [f.key]: e.target.value})}
                    className="px-3 py-2 border rounded-lg min-w-[150px]">
                    <option value="">{t('detailedReport.allFilter')}</option>
                    {getFilterOptions(f.key, f).map((o: any) => (
                      <option key={o.value} value={o.value}>{o.labelKey ? t(o.labelKey) : o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={runReport} disabled={loading || !activeBudget}
              className="btn-primary disabled:opacity-50">
              {loading ? t('detailedReport.generating') : t('detailedReport.generate')}
            </button>
            {data && data.rows.length > 0 && (
              <button onClick={exportExcel} className="btn-success">
                {t('detailedReport.downloadCsv')}
              </button>
            )}
          </div>

          {data && (
            data.rows.length === 0 ? (
              <p className="text-center py-8 text-gray-500">{t('detailedReport.noResults')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {selectedReport.columns.map(c => (
                        <th key={c.key} className={`p-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{t(c.labelKey)}</th>
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
