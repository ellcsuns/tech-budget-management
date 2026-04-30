// ReconciliationPage - Monthly budget execution reconciliation
import { useState, useEffect, useMemo, useCallback } from 'react';
import { reconciliationApi } from '../services/api';
import type {
  ReconciliationSummary,
  ReconciliationLineSummary,
  ReconciliationMonthData,
  ReconciliationMonthStatus,
  ReconciliationUserTracking,
  MonthlyReconciliationRecord,
} from '../types';
import { fmt } from '../utils/formatters';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';
import {
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineArrowsRightLeft,
  HiOutlineAdjustmentsHorizontal,
} from 'react-icons/hi2';

const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function ReconciliationPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [userStatus, setUserStatus] = useState<ReconciliationMonthStatus[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog state
  const [underDialog, setUnderDialog] = useState<{ line: ReconciliationLineSummary; monthData: ReconciliationMonthData } | null>(null);
  const [overDialog, setOverDialog] = useState<{ line: ReconciliationLineSummary; monthData: ReconciliationMonthData } | null>(null);

  // History state
  const [historyLineId, setHistoryLineId] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<MonthlyReconciliationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin tracking
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<ReconciliationUserTracking[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const canModify = hasPermission('monthly-reconciliation', 'MODIFY');

  // ── Data loading ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, statusRes] = await Promise.all([
        reconciliationApi.getSummary(),
        reconciliationApi.getStatus(),
      ]);
      setSummary(summaryRes.data);
      setUserStatus(statusRes.data.months || []);

      // Auto-select first pending closed month
      const currentMonth = summaryRes.data.currentMonth;
      const pendingMonths = (statusRes.data.months || []).filter(
        (ms: ReconciliationMonthStatus) => !ms.isComplete && ms.month < currentMonth
      );
      if (pendingMonths.length > 0) {
        setSelectedMonth(pendingMonths[0].month);
      } else if (currentMonth > 1) {
        setSelectedMonth(currentMonth - 1);
      }
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
      showToast('Error al cargar datos de conciliación', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Computed values ────────────────────────────────────────────────────
  const closedMonths = useMemo(() => {
    if (!summary) return [];
    return Array.from({ length: summary.currentMonth - 1 }, (_, i) => i + 1);
  }, [summary]);

  const pendingMonthCount = useMemo(() => {
    return userStatus.filter(ms => !ms.isComplete).length;
  }, [userStatus]);

  const pendingMonthNames = useMemo(() => {
    return userStatus.filter(ms => !ms.isComplete).map(ms => MONTH_LABELS[ms.month - 1]);
  }, [userStatus]);

  const selectedMonthLines = useMemo(() => {
    if (!summary || selectedMonth === null) return [];
    return summary.lines.map(line => {
      const monthData = line.months.find(m => m.month === selectedMonth);
      return { line, monthData };
    }).filter(item => item.monthData);
  }, [summary, selectedMonth]);

  const monthStatus = useMemo(() => {
    if (selectedMonth === null) return null;
    return userStatus.find(ms => ms.month === selectedMonth) || null;
  }, [userStatus, selectedMonth]);

  // ── History ────────────────────────────────────────────────────────────
  const toggleHistory = async (budgetLineId: string) => {
    if (historyLineId === budgetLineId) {
      setHistoryLineId(null);
      setHistoryRecords([]);
      return;
    }
    setHistoryLineId(budgetLineId);
    setHistoryLoading(true);
    try {
      const res = await reconciliationApi.getHistory(budgetLineId);
      setHistoryRecords(res.data);
    } catch {
      showToast('Error al cargar historial', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Admin tracking ─────────────────────────────────────────────────────
  const loadTracking = async () => {
    if (showTracking) { setShowTracking(false); return; }
    setShowTracking(true);
    setTrackingLoading(true);
    try {
      const res = await reconciliationApi.getTracking();
      setTrackingData(res.data.users || []);
    } catch {
      showToast('Error al cargar seguimiento', 'error');
    } finally {
      setTrackingLoading(false);
    }
  };

  // ── Action handlers ────────────────────────────────────────────────────
  const handleReconcileClick = (line: ReconciliationLineSummary, monthData: ReconciliationMonthData) => {
    if (monthData.isReconciled) return;
    if (monthData.difference > 0) {
      setUnderDialog({ line, monthData });
    } else if (monthData.difference < 0) {
      setOverDialog({ line, monthData });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">{t('msg.loading') || 'Cargando...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Reminder Banner ─────────────────────────────────────────────── */}
      <ReminderBanner
        pendingCount={pendingMonthCount}
        pendingMonthNames={pendingMonthNames}
        t={t}
      />

      {/* ── Month Selector Tabs ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('reconciliation.title') || 'Conciliación Mensual'}
          </h1>
          <div className="flex items-center gap-2">
            {canModify && (
              <button
                onClick={loadTracking}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  showTracking
                    ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
                {t('reconciliation.tracking') || 'Seguimiento'}
              </button>
            )}
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-all"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {closedMonths.map(m => {
            const ms = userStatus.find(s => s.month === m);
            const isComplete = ms?.isComplete ?? false;
            const isSelected = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-accent text-white border-accent'
                    : isComplete
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                }`}
              >
                {isComplete && !isSelected && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
                {!isComplete && !isSelected && <HiOutlineClock className="w-3.5 h-3.5" />}
                {MONTH_LABELS[m - 1]}
                {ms && !isComplete && (
                  <span className="text-[10px] opacity-75">
                    ({ms.reconciledLines}/{ms.totalLines})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {closedMonths.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            {t('reconciliation.noClosedMonths') || 'No hay meses cerrados para conciliar.'}
          </p>
        )}
      </div>

      {/* ── Summary Table ───────────────────────────────────────────────── */}
      {selectedMonth !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('reconciliation.summary') || 'Resumen de Ejecución'} — {MONTH_LABELS[selectedMonth - 1]}
            </h2>
            {monthStatus && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                monthStatus.isComplete
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {monthStatus.isComplete
                  ? (t('reconciliation.complete') || 'Completo')
                  : `${monthStatus.reconciledLines}/${monthStatus.totalLines} ${t('reconciliation.reconciled') || 'conciliados'}`}
              </span>
            )}
          </div>
          <ReconciliationSummaryTable
            lines={selectedMonthLines}
            selectedMonth={selectedMonth}
            onReconcile={handleReconcileClick}
            onToggleHistory={toggleHistory}
            historyLineId={historyLineId}
            t={t}
          />
        </div>
      )}

      {/* ── History Panel ───────────────────────────────────────────────── */}
      {historyLineId && (
        <ReconciliationHistory
          records={historyRecords}
          loading={historyLoading}
          t={t}
        />
      )}

      {/* ── Admin Tracking Matrix ───────────────────────────────────────── */}
      {showTracking && (
        <AdminTrackingMatrix
          data={trackingData}
          loading={trackingLoading}
          closedMonths={closedMonths}
          t={t}
        />
      )}

      {/* ── Under-Execution Dialog ──────────────────────────────────────── */}
      {underDialog && (
        <UnderExecutionDialog
          line={underDialog.line}
          monthData={underDialog.monthData}
          summary={summary!}
          onClose={() => setUnderDialog(null)}
          onSuccess={() => { setUnderDialog(null); loadData(); }}
          actionLoading={actionLoading}
          setActionLoading={setActionLoading}
          t={t}
        />
      )}

      {/* ── Over-Execution Dialog ───────────────────────────────────────── */}
      {overDialog && (
        <OverExecutionDialog
          line={overDialog.line}
          monthData={overDialog.monthData}
          summary={summary!}
          onClose={() => setOverDialog(null)}
          onSuccess={() => { setOverDialog(null); loadData(); }}
          actionLoading={actionLoading}
          setActionLoading={setActionLoading}
          t={t}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// Component: ReminderBanner (Task 5.2)
// ═══════════════════════════════════════════════════════════════════════════

function ReminderBanner({
  pendingCount,
  pendingMonthNames,
  t,
}: {
  pendingCount: number;
  pendingMonthNames: string[];
  t: (key: string) => string;
}) {
  if (pendingCount === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
      <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {t('reconciliation.reminderTitle') || 'Conciliaciones Pendientes'}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          {(t('reconciliation.reminderMessage') || 'Tienes {count} mes(es) pendiente(s) de conciliar').replace('{count}', String(pendingCount))}
          {pendingMonthNames.length > 0 && (
            <span className="ml-1 font-medium">({pendingMonthNames.join(', ')})</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Component: ReconciliationSummaryTable (Task 5.3)
// ═══════════════════════════════════════════════════════════════════════════

function ReconciliationSummaryTable({
  lines,
  selectedMonth,
  onReconcile,
  onToggleHistory,
  historyLineId,
  t,
}: {
  lines: { line: ReconciliationLineSummary; monthData: ReconciliationMonthData | undefined }[];
  selectedMonth: number;
  onReconcile: (line: ReconciliationLineSummary, monthData: ReconciliationMonthData) => void;
  onToggleHistory: (budgetLineId: string) => void;
  historyLineId: string | null;
  t: (key: string) => string;
}) {
  if (lines.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        {t('reconciliation.noLines') || 'No hay líneas de presupuesto para este mes.'}
      </div>
    );
  }

  // Totals
  const totalPlanned = lines.reduce((s, l) => s + (l.monthData?.planned || 0), 0);
  const totalActual = lines.reduce((s, l) => s + (l.monthData?.actual || 0), 0);
  const totalDiff = lines.reduce((s, l) => s + (l.monthData?.difference || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">{t('table.code') || 'Código'}</th>
            <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">{t('label.description') || 'Descripción'}</th>
            <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">{t('label.company') || 'Empresa'}</th>
            <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">{t('label.currency') || 'Moneda'}</th>
            <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t('reconciliation.planned') || 'Planificado'}</th>
            <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t('reconciliation.actual') || 'Real'}</th>
            <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t('reconciliation.difference') || 'Diferencia'}</th>
            <th className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{t('label.status') || 'Estado'}</th>
            <th className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{t('label.actions') || 'Acciones'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {lines.map(({ line, monthData }) => {
            if (!monthData) return null;
            const diff = monthData.difference;
            const isUnder = diff > 0.01;
            const isOver = diff < -0.01;
            const isReconciled = monthData.isReconciled;

            return (
              <tr
                key={line.budgetLineId}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  historyLineId === line.budgetLineId ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{line.expenseCode}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={line.expenseDescription}>
                  {line.expenseDescription}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.financialCompany}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.currency}</td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">${fmt(monthData.planned)}</td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">${fmt(monthData.actual)}</td>
                <td className={`px-3 py-2 text-right font-medium ${
                  isUnder ? 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10' :
                  isOver ? 'text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10' :
                  'text-green-700 dark:text-green-400'
                }`}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </td>
                <td className="px-3 py-2 text-center">
                  {isReconciled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <HiOutlineCheckCircle className="w-3 h-3" />
                      {monthData.reconciliation?.decisionType === 'SAVING'
                        ? (t('reconciliation.savingLabel') || 'Ahorro')
                        : monthData.reconciliation?.decisionType === 'REDISTRIBUTION'
                        ? (t('reconciliation.redistributionLabel') || 'Redistribuido')
                        : monthData.reconciliation?.decisionType === 'ADJUSTMENT'
                        ? (t('reconciliation.adjustmentLabel') || 'Ajustado')
                        : (t('reconciliation.reconciled') || 'Conciliado')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      <HiOutlineClock className="w-3 h-3" />
                      {t('reconciliation.pending') || 'Pendiente'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {!isReconciled && (isUnder || isOver) && (
                      <button
                        onClick={() => onReconcile(line, monthData)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-accent text-white hover:opacity-90 transition-opacity"
                      >
                        {isUnder ? (t('reconciliation.reconcileUnder') || 'Conciliar') : (t('reconciliation.reconcileOver') || 'Ajustar')}
                      </button>
                    )}
                    {!isReconciled && !isUnder && !isOver && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                        {t('reconciliation.balanced') || 'Balanceado'}
                      </span>
                    )}
                    <button
                      onClick={() => onToggleHistory(line.budgetLineId)}
                      className={`p-1 rounded transition-colors ${
                        historyLineId === line.budgetLineId
                          ? 'text-accent bg-accent/10'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                      title={t('reconciliation.history') || 'Historial'}
                    >
                      {historyLineId === line.budgetLineId ? (
                        <HiOutlineChevronUp className="w-4 h-4" />
                      ) : (
                        <HiOutlineChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 dark:bg-gray-700 font-semibold">
          <tr>
            <td colSpan={4} className="px-3 py-2 text-gray-700 dark:text-gray-300">Total</td>
            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">${fmt(totalPlanned)}</td>
            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">${fmt(totalActual)}</td>
            <td className={`px-3 py-2 text-right ${
              totalDiff > 0.01 ? 'text-amber-700 dark:text-amber-400' :
              totalDiff < -0.01 ? 'text-red-700 dark:text-red-400' :
              'text-green-700 dark:text-green-400'
            }`}>
              {totalDiff > 0 ? '+' : ''}{fmt(totalDiff)}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// Component: UnderExecutionDialog (Task 5.4)
// ═══════════════════════════════════════════════════════════════════════════

function UnderExecutionDialog({
  line,
  monthData,
  summary,
  onClose,
  onSuccess,
  actionLoading,
  setActionLoading,
  t,
}: {
  line: ReconciliationLineSummary;
  monthData: ReconciliationMonthData;
  summary: ReconciliationSummary;
  onClose: () => void;
  onSuccess: () => void;
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;
  t: (key: string) => string;
}) {
  const [mode, setMode] = useState<'saving' | 'redistribute'>('saving');
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const underAmount = monthData.difference;
  const month = monthData.month;

  // Future months for redistribution
  const futureMonths = useMemo(() => {
    return Array.from({ length: 12 - month }, (_, i) => month + 1 + i);
  }, [month]);

  // Get planned values for future months from summary
  const futureMonthPlanned = useMemo(() => {
    const map: Record<number, number> = {};
    const lineData = summary.lines.find(l => l.budgetLineId === line.budgetLineId);
    if (lineData) {
      lineData.months.forEach(m => {
        if (m.month > month) map[m.month] = m.planned;
      });
    }
    return map;
  }, [summary, line.budgetLineId, month]);

  const distributionSum = Object.values(distribution).reduce((a, b) => a + b, 0);
  const sumValid = Math.abs(distributionSum - underAmount) < 0.01;

  const handleConfirmSaving = async () => {
    setActionLoading(true);
    try {
      await reconciliationApi.confirmSaving({
        budgetLineId: line.budgetLineId,
        month,
        amount: underAmount,
      });
      showToast(t('reconciliation.savingConfirmed') || 'Ahorro confirmado exitosamente', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al confirmar ahorro', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedistribute = async () => {
    if (!sumValid) {
      showToast(t('reconciliation.sumMismatch') || 'La suma debe ser igual a la diferencia', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await reconciliationApi.redistribute({
        budgetLineId: line.budgetLineId,
        month,
        distribution,
      });
      showToast(t('reconciliation.redistributionCreated') || 'Redistribución enviada para aprobación', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al redistribuir', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('reconciliation.underExecution') || 'Sub-ejecución'} — {MONTH_LABELS[month - 1]}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Line info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{line.expenseCode}</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{line.expenseDescription}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('reconciliation.planned') || 'Planificado'}</span>
            <span className="text-gray-700 dark:text-gray-300">${fmt(monthData.planned)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('reconciliation.actual') || 'Real'}</span>
            <span className="text-gray-700 dark:text-gray-300">${fmt(monthData.actual)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-amber-700 dark:text-amber-400">{t('reconciliation.underExecution') || 'Sub-ejecución'}</span>
            <span className="text-amber-700 dark:text-amber-400">+${fmt(underAmount)}</span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('saving')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
              mode === 'saving'
                ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
            }`}
          >
            <HiOutlineBanknotes className="w-4 h-4" />
            {t('reconciliation.confirmSaving') || 'Confirmar Ahorro'}
          </button>
          <button
            onClick={() => setMode('redistribute')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
              mode === 'redistribute'
                ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
            }`}
          >
            <HiOutlineArrowsRightLeft className="w-4 h-4" />
            {t('reconciliation.redistribute') || 'Redistribuir'}
          </button>
        </div>

        {/* Saving mode */}
        {mode === 'saving' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('reconciliation.savingExplanation') || 'Se confirmará la sub-ejecución como ahorro. El monto se registrará como ahorro activo para esta línea.'}
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
              <span className="text-xs text-green-600 dark:text-green-400">{t('reconciliation.savingAmount') || 'Monto del ahorro'}</span>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">${fmt(underAmount)}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="btn-cancel text-xs">{t('btn.cancel') || 'Cancelar'}</button>
              <button
                onClick={handleConfirmSaving}
                disabled={actionLoading}
                className="btn-success text-xs"
              >
                {actionLoading ? (t('msg.loading') || 'Cargando...') : (t('reconciliation.confirmSaving') || 'Confirmar Ahorro')}
              </button>
            </div>
          </div>
        )}

        {/* Redistribute mode */}
        {mode === 'redistribute' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('reconciliation.redistributeExplanation') || 'Distribuye la sub-ejecución en meses futuros. La suma debe ser igual a la diferencia.'}
            </p>

            {futureMonths.length === 0 ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {t('reconciliation.noFutureMonths') || 'No hay meses futuros disponibles'}
              </p>
            ) : (
              <>
                <div className="border dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                  <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <span className="w-12">{t('label.month') || 'Mes'}</span>
                    <span className="flex-1 text-right">{t('reconciliation.currentPlanned') || 'Plan actual'}</span>
                    <span className="w-28 text-right ml-3">{t('reconciliation.addAmount') || 'Agregar'}</span>
                  </div>
                  {futureMonths.map(fm => (
                    <div key={fm} className="flex items-center px-3 py-1.5">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12">{MONTH_LABELS[fm - 1]}</span>
                      <span className="flex-1 text-right text-xs text-gray-500 dark:text-gray-400">
                        ${fmt(futureMonthPlanned[fm] || 0)}
                      </span>
                      <div className="w-28 ml-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={distribution[fm] || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setDistribution(prev => ({ ...prev, [fm]: val }));
                          }}
                          className="w-full border dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-accent focus:border-accent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('reconciliation.distributionSum') || 'Suma distribución'}: <span className={`font-semibold ${sumValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>${fmt(distributionSum)}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('reconciliation.required') || 'Requerido'}: <span className="font-semibold text-amber-700 dark:text-amber-400">${fmt(underAmount)}</span>
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={onClose} className="btn-cancel text-xs">{t('btn.cancel') || 'Cancelar'}</button>
                  <button
                    onClick={handleRedistribute}
                    disabled={actionLoading || !sumValid}
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {actionLoading ? (t('msg.loading') || 'Cargando...') : (t('reconciliation.redistribute') || 'Redistribuir')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// Component: OverExecutionDialog (Task 5.5)
// ═══════════════════════════════════════════════════════════════════════════

function OverExecutionDialog({
  line,
  monthData,
  summary,
  onClose,
  onSuccess,
  actionLoading,
  setActionLoading,
  t,
}: {
  line: ReconciliationLineSummary;
  monthData: ReconciliationMonthData;
  summary: ReconciliationSummary;
  onClose: () => void;
  onSuccess: () => void;
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;
  t: (key: string) => string;
}) {
  const [reductions, setReductions] = useState<Record<number, number>>({});
  const overAmount = Math.abs(monthData.difference);
  const month = monthData.month;

  // Future months
  const futureMonths = useMemo(() => {
    return Array.from({ length: 12 - month }, (_, i) => month + 1 + i);
  }, [month]);

  // Get planned values for future months
  const futureMonthPlanned = useMemo(() => {
    const map: Record<number, number> = {};
    const lineData = summary.lines.find(l => l.budgetLineId === line.budgetLineId);
    if (lineData) {
      lineData.months.forEach(m => {
        if (m.month > month) map[m.month] = m.planned;
      });
    }
    return map;
  }, [summary, line.budgetLineId, month]);

  const reductionSum = Object.values(reductions).reduce((a, b) => a + b, 0);
  const isSufficient = reductionSum >= overAmount - 0.01;

  // Check no month goes below zero
  const monthBelowZero = futureMonths.some(fm => {
    const planned = futureMonthPlanned[fm] || 0;
    const reduction = reductions[fm] || 0;
    return planned - reduction < -0.01;
  });

  const handleAdjust = async () => {
    if (!isSufficient) {
      showToast(t('reconciliation.insufficientBudget') || 'Reducciones insuficientes', 'error');
      return;
    }
    if (monthBelowZero) {
      showToast(t('reconciliation.monthBelowZero') || 'Un mes quedaría con valor negativo', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await reconciliationApi.adjust({
        budgetLineId: line.budgetLineId,
        month,
        reductions,
      });
      showToast(t('reconciliation.adjustmentCreated') || 'Ajuste enviado para aprobación', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al ajustar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('reconciliation.overExecution') || 'Sobre-ejecución'} — {MONTH_LABELS[month - 1]}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Line info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{line.expenseCode}</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{line.expenseDescription}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('reconciliation.planned') || 'Planificado'}</span>
            <span className="text-gray-700 dark:text-gray-300">${fmt(monthData.planned)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('reconciliation.actual') || 'Real'}</span>
            <span className="text-gray-700 dark:text-gray-300">${fmt(monthData.actual)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-red-700 dark:text-red-400">{t('reconciliation.overExecution') || 'Sobre-ejecución'}</span>
            <span className="text-red-700 dark:text-red-400">-${fmt(overAmount)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {t('reconciliation.adjustExplanation') || 'Reduce el presupuesto de meses futuros para compensar la sobre-ejecución. La suma de reducciones debe ser >= al monto de sobre-ejecución.'}
        </p>

        {futureMonths.length === 0 ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {t('reconciliation.noFutureMonths') || 'No hay meses futuros disponibles'}
          </p>
        ) : (
          <>
            <div className="border dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
              <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                <span className="w-12">{t('label.month') || 'Mes'}</span>
                <span className="flex-1 text-right">{t('reconciliation.currentPlanned') || 'Plan actual'}</span>
                <span className="w-28 text-right ml-3">{t('reconciliation.reduceAmount') || 'Reducir'}</span>
                <span className="w-20 text-right ml-2">{t('reconciliation.newValue') || 'Nuevo'}</span>
              </div>
              {futureMonths.map(fm => {
                const planned = futureMonthPlanned[fm] || 0;
                const reduction = reductions[fm] || 0;
                const newVal = planned - reduction;
                const belowZero = newVal < -0.01;
                const exceedsPlanned = reduction > planned + 0.01;
                return (
                  <div key={fm} className={`flex items-center px-3 py-1.5 ${belowZero ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12">{MONTH_LABELS[fm - 1]}</span>
                    <span className="flex-1 text-right text-xs text-gray-500 dark:text-gray-400">
                      ${fmt(planned)}
                    </span>
                    <div className="w-28 ml-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={planned}
                        value={reductions[fm] || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setReductions(prev => ({ ...prev, [fm]: val }));
                        }}
                        className={`w-full border rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-accent focus:border-accent ${
                          exceedsPlanned ? 'border-red-400 dark:border-red-600' : 'dark:border-gray-600'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    <span className={`w-20 text-right text-xs font-medium ml-2 ${
                      belowZero ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      ${fmt(Math.max(0, newVal))}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-xs px-1 mt-3">
              <span className="text-gray-500 dark:text-gray-400">
                {t('reconciliation.totalReductions') || 'Total reducciones'}: <span className={`font-semibold ${isSufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>${fmt(reductionSum)}</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {t('reconciliation.required') || 'Requerido'}: <span className="font-semibold text-red-700 dark:text-red-400">&ge; ${fmt(overAmount)}</span>
              </span>
            </div>

            {monthBelowZero && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {t('reconciliation.monthBelowZero') || 'El valor de un mes no puede ser negativo'}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={onClose} className="btn-cancel text-xs">{t('btn.cancel') || 'Cancelar'}</button>
              <button
                onClick={handleAdjust}
                disabled={actionLoading || !isSufficient || monthBelowZero}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {actionLoading ? (t('msg.loading') || 'Cargando...') : (t('reconciliation.adjust') || 'Ajustar Previsión')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// Component: ReconciliationHistory (Task 5.6)
// ═══════════════════════════════════════════════════════════════════════════

function ReconciliationHistory({
  records,
  loading,
  t,
}: {
  records: MonthlyReconciliationRecord[];
  loading: boolean;
  t: (key: string) => string;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('msg.loading') || 'Cargando...'}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('reconciliation.noHistory') || 'No hay historial de conciliación para esta línea.'}
      </div>
    );
  }

  const decisionLabel = (type: string) => {
    switch (type) {
      case 'SAVING': return t('reconciliation.savingLabel') || 'Ahorro';
      case 'REDISTRIBUTION': return t('reconciliation.redistributionLabel') || 'Redistribución';
      case 'ADJUSTMENT': return t('reconciliation.adjustmentLabel') || 'Ajuste';
      default: return type;
    }
  };

  const decisionColor = (type: string) => {
    switch (type) {
      case 'SAVING': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'REDISTRIBUTION': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'ADJUSTMENT': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const decisionIcon = (type: string) => {
    switch (type) {
      case 'SAVING': return <HiOutlineBanknotes className="w-3.5 h-3.5" />;
      case 'REDISTRIBUTION': return <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />;
      case 'ADJUSTMENT': return <HiOutlineAdjustmentsHorizontal className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('reconciliation.history') || 'Historial de Conciliación'}
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-600">
        {records.map(record => (
          <div key={record.id} className="px-4 py-3 flex items-start gap-3">
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${decisionColor(record.decisionType)}`}>
              {decisionIcon(record.decisionType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${decisionColor(record.decisionType)}`}>
                  {decisionLabel(record.decisionType)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {MONTH_LABELS[record.month - 1]} {record.year}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex gap-4 flex-wrap">
                <span>{t('reconciliation.planned') || 'Plan'}: ${fmt(record.plannedAmount)}</span>
                <span>{t('reconciliation.actual') || 'Real'}: ${fmt(record.actualAmount)}</span>
                <span className="font-medium">
                  {t('reconciliation.difference') || 'Dif'}: {record.differenceAmount > 0 ? '+' : ''}{fmt(record.differenceAmount)}
                </span>
              </div>
              {record.details && Object.keys(record.details).length > 0 && (
                <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-500">
                  {Object.entries(record.details).map(([k, v]) => (
                    <span key={k} className="mr-2">
                      {k.startsWith('M') || !isNaN(Number(k)) ? `M${k}` : k}: {typeof v === 'number' ? fmt(v) : String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{record.user?.fullName || '-'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Component: AdminTrackingMatrix (Task 5.7)
// ═══════════════════════════════════════════════════════════════════════════

function AdminTrackingMatrix({
  data,
  loading,
  closedMonths,
  t,
}: {
  data: ReconciliationUserTracking[];
  loading: boolean;
  closedMonths: number[];
  t: (key: string) => string;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('msg.loading') || 'Cargando...'}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('reconciliation.noTrackingData') || 'No hay datos de seguimiento disponibles.'}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('reconciliation.tracking') || 'Seguimiento de Conciliación'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                {t('label.user') || 'Usuario'}
              </th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">
                {t('label.direction') || 'Dirección'}
              </th>
              {closedMonths.map(m => (
                <th key={m} className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                  {MONTH_LABELS[m - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {data.map(user => (
              <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">
                  {user.fullName}
                </td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{user.technologyDirection}</td>
                {closedMonths.map(m => {
                  const monthInfo = user.months.find(um => um.month === m);
                  const isComplete = monthInfo?.isComplete ?? false;
                  return (
                    <td key={m} className="px-3 py-2 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30" title={monthInfo?.reconciledAt ? new Date(monthInfo.reconciledAt).toLocaleDateString() : ''}>
                          <HiOutlineCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
                          <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
