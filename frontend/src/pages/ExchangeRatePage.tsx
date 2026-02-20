import { useState, useEffect } from 'react';
import { budgetApi, conversionRateApi } from '../services/api';
import type { Budget, ConversionRate } from '../types';
import { showToast } from '../components/Toast';
import { useI18n } from '../contexts/I18nContext';

const MONTHS_KEYS = [1,2,3,4,5,6,7,8,9,10,11,12];
const CURRENCIES = ['CLP', 'EUR', 'BRL', 'MXN'];

export default function ExchangeRatePage() {
  const { t } = useI18n();
  const MONTHS = MONTHS_KEYS.map(m => t(`month.short.${m}`));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [rates, setRates] = useState<ConversionRate[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) loadRates(selectedBudgetId);
  }, [selectedBudgetId]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      const active = res.data.find((b: Budget) => b.isActive);
      if (active) setSelectedBudgetId(active.id);
      else if (res.data.length > 0) setSelectedBudgetId(res.data[0].id);
    } catch (error) { console.error('Error:', error); }
    finally { setIsLoading(false); }
  };

  const loadRates = async (budgetId: string) => {
    try {
      const res = await conversionRateApi.getByBudget(budgetId);
      setRates(res.data);
      const vals: Record<string, string> = {};
      res.data.forEach((r: ConversionRate) => {
        vals[`${r.currency}-${r.month}`] = String(r.rate);
      });
      setEditValues(vals);
    } catch (error) { console.error('Error:', error); }
  };

  const getKey = (currency: string, month: number) => `${currency}-${month}`;

  const getValue = (currency: string, month: number): string => {
    return editValues[getKey(currency, month)] || '';
  };

  const handleChange = (currency: string, month: number, value: string) => {
    setEditValues({ ...editValues, [getKey(currency, month)]: value });
  };

  const handleSaveAll = async () => {
    if (!selectedBudgetId) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const currency of CURRENCIES) {
        for (let month = 1; month <= 12; month++) {
          const val = editValues[getKey(currency, month)];
          const rate = parseFloat(val);
          if (!isNaN(rate) && rate > 0) {
            await conversionRateApi.create({ budgetId: selectedBudgetId, currency, month, rate });
            count++;
          }
        }
      }
      showToast(`${count} ${t('exchangeRate.saved')}`, 'success');
      loadRates(selectedBudgetId);
    } catch (error: any) {
      showToast(error.response?.data?.error || t('exchangeRate.errorSaving'), 'error');
    } finally { setIsSaving(false); }
  };

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);

  if (isLoading) return <div className="text-center py-8">{t('msg.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-bold">{t('exchangeRate.title')}</h2>
          <select value={selectedBudgetId} onChange={e => setSelectedBudgetId(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm min-w-[220px]">
            {budgets.map(b => (
              <option key={b.id} value={b.id}>{b.year} - {b.version}{b.isActive ? ` ${t('common.active')}` : ''}</option>
            ))}
          </select>
          {selectedBudget?.isActive && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">{t('common.active')}</span>
          )}
          <button onClick={handleSaveAll} disabled={isSaving}
            className="ml-auto px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">
            {isSaving ? t('exchangeRate.saving') : t('exchangeRate.saveAll')}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {t('exchangeRate.helpText')}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('exchangeRate.currency')}</th>
                {MONTHS.map((m, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {CURRENCIES.map(currency => (
                <tr key={currency} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{currency}</td>
                  {MONTHS.map((_, mi) => {
                    const month = mi + 1;
                    const val = getValue(currency, month);
                    const existingRate = rates.find(r => r.currency === currency && r.month === month);
                    const hasValue = !!existingRate;
                    return (
                      <td key={month} className="px-1 py-1">
                        <input
                          type="number" step="0.000001" value={val}
                          onChange={e => handleChange(currency, month, e.target.value)}
                          placeholder="0.000000"
                          className={`w-24 border rounded px-2 py-1 text-xs text-right ${hasValue ? 'bg-white' : 'bg-yellow-50'} focus:ring-1 focus:ring-accent`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* USD row - always 1 */}
              <tr className="bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">USD</td>
                {MONTHS.map((_, mi) => (
                  <td key={mi} className="px-1 py-1 text-center text-xs text-gray-400">1.000000</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
