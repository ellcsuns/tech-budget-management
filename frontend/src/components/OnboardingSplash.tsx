import React, { useState } from 'react';
const ArrowRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

interface Slide {
  title: string;
  description: string;
  features: string[];
  gradient: string;
  illustration: React.ReactNode;
}

/* ── Inline SVG illustrations for each slide ── */

const DashboardIllustration = () => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    {/* Monitor */}
    <rect x="60" y="20" width="200" height="130" rx="10" fill="#1e293b" stroke="#6366F1" strokeWidth="2" />
    <rect x="70" y="30" width="180" height="100" rx="4" fill="#0f172a" />
    {/* Chart bars */}
    <rect x="85" y="90" width="20" height="35" rx="3" fill="#6366F1" opacity="0.6" />
    <rect x="115" y="75" width="20" height="50" rx="3" fill="#6366F1" opacity="0.8" />
    <rect x="145" y="55" width="20" height="70" rx="3" fill="#8B5CF6" />
    <rect x="175" y="65" width="20" height="60" rx="3" fill="#6366F1" opacity="0.8" />
    <rect x="205" y="45" width="20" height="80" rx="3" fill="#a78bfa" />
    {/* Trend line */}
    <path d="M95 85 L125 70 L155 50 L185 60 L215 40" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="215" cy="40" r="4" fill="#22d3ee" />
    {/* KPI cards */}
    <rect x="75" y="35" width="40" height="18" rx="3" fill="#1e3a5f" />
    <rect x="120" y="35" width="40" height="18" rx="3" fill="#1e3a5f" />
    <rect x="165" y="35" width="40" height="18" rx="3" fill="#1e3a5f" />
    {/* Monitor stand */}
    <rect x="140" y="150" width="40" height="8" rx="2" fill="#334155" />
    <rect x="120" y="158" width="80" height="6" rx="3" fill="#475569" />
    {/* Sparkle */}
    <circle cx="240" cy="35" r="6" fill="#fbbf24" opacity="0.8" />
    <path d="M240 28V42M233 35H247" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BudgetIllustration = () => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Spreadsheet */}
    <rect x="50" y="25" width="220" height="150" rx="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
    {/* Header row */}
    <rect x="50" y="25" width="220" height="28" rx="10" fill="#10b981" />
    <rect x="50" y="43" width="220" height="10" fill="#10b981" />
    {/* Column headers */}
    <text x="80" y="42" fill="white" fontSize="9" fontWeight="bold">M1</text>
    <text x="115" y="42" fill="white" fontSize="9" fontWeight="bold">M2</text>
    <text x="150" y="42" fill="white" fontSize="9" fontWeight="bold">M3</text>
    <text x="185" y="42" fill="white" fontSize="9" fontWeight="bold">M4</text>
    <text x="220" y="42" fill="white" fontSize="9" fontWeight="bold">M5</text>
    {/* Grid lines */}
    {[65, 85, 105, 125, 145].map((y, i) => (
      <g key={i}>
        <line x1="50" y1={y} x2="270" y2={y} stroke="#d1fae5" strokeWidth="1" />
        <rect x="60" y={y + 3} width="30" height="6" rx="2" fill="#6ee7b7" opacity="0.5" />
        {[95, 130, 165, 200, 235].map((x, j) => (
          <rect key={j} x={x} y={y + 3} width="25" height="6" rx="2" fill="#a7f3d0" opacity={0.4 + j * 0.1} />
        ))}
      </g>
    ))}
    {/* Comparison arrows */}
    <path d="M280 70L295 70L295 110L280 110" stroke="#10b981" strokeWidth="2" fill="none" />
    <text x="298" y="94" fill="#10b981" fontSize="10" fontWeight="bold">v1↔v2</text>
    {/* Coin stack */}
    <ellipse cx="35" cy="155" rx="18" ry="6" fill="#fbbf24" />
    <rect x="17" y="145" width="36" height="10" fill="#fbbf24" />
    <ellipse cx="35" cy="145" rx="18" ry="6" fill="#fcd34d" />
    <rect x="17" y="135" width="36" height="10" fill="#fbbf24" />
    <ellipse cx="35" cy="135" rx="18" ry="6" fill="#fde68a" />
  </svg>
);

const TransactionsIllustration = () => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Two cards overlapping */}
    <rect x="40" y="40" width="150" height="120" rx="12" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
    <text x="55" y="65" fill="#7c3aed" fontSize="10" fontWeight="bold">COMPROMETIDAS</text>
    <rect x="55" y="75" width="120" height="8" rx="3" fill="#c4b5fd" />
    <rect x="55" y="90" width="100" height="8" rx="3" fill="#c4b5fd" opacity="0.7" />
    <rect x="55" y="105" width="110" height="8" rx="3" fill="#c4b5fd" opacity="0.5" />
    <rect x="55" y="120" width="80" height="8" rx="3" fill="#c4b5fd" opacity="0.4" />
    {/* Lock icon */}
    <rect x="145" y="130" width="20" height="16" rx="3" fill="#7c3aed" />
    <path d="M149 130V126A6 6 0 0 1 161 126V130" stroke="#7c3aed" strokeWidth="2" fill="none" />

    <rect x="130" y="50" width="150" height="120" rx="12" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
    <text x="145" y="75" fill="#22c55e" fontSize="10" fontWeight="bold">REALES</text>
    <rect x="145" y="85" width="120" height="8" rx="3" fill="#86efac" />
    <rect x="145" y="100" width="100" height="8" rx="3" fill="#86efac" opacity="0.7" />
    <rect x="145" y="115" width="110" height="8" rx="3" fill="#86efac" opacity="0.5" />
    <rect x="145" y="130" width="80" height="8" rx="3" fill="#86efac" opacity="0.4" />
    {/* Check icon */}
    <circle cx="250" cy="145" r="10" fill="#22c55e" />
    <path d="M245 145L248 148L255 141" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Arrow connecting */}
    <path d="M195 100L205 100" stroke="#6b7280" strokeWidth="2" strokeDasharray="4 2" />
  </svg>
);

const SavingsIllustration = () => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Piggy bank body */}
    <ellipse cx="160" cy="110" rx="70" ry="55" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
    {/* Ear */}
    <ellipse cx="115" cy="75" rx="15" ry="20" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
    {/* Eye */}
    <circle cx="130" cy="95" r="5" fill="#92400e" />
    <circle cx="128" cy="93" r="2" fill="white" />
    {/* Snout */}
    <ellipse cx="95" cy="110" rx="18" ry="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
    <circle cx="90" cy="108" r="2.5" fill="#92400e" />
    <circle cx="100" cy="108" r="2.5" fill="#92400e" />
    {/* Legs */}
    <rect x="120" y="155" width="14" height="20" rx="5" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
    <rect x="185" y="155" width="14" height="20" rx="5" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
    {/* Coin slot */}
    <rect x="148" y="58" width="24" height="5" rx="2.5" fill="#92400e" />
    {/* Coins falling in */}
    <circle cx="155" cy="40" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
    <text x="152" y="44" fill="#92400e" fontSize="10" fontWeight="bold">$</text>
    <circle cx="175" cy="25" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
    <text x="172.5" y="28.5" fill="#92400e" fontSize="8" fontWeight="bold">$</text>
    {/* Calendar icon */}
    <rect x="230" y="60" width="50" height="45" rx="6" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
    <rect x="230" y="60" width="50" height="14" rx="6" fill="#f59e0b" />
    <text x="243" y="71" fill="white" fontSize="8" fontWeight="bold">2025</text>
    {[82, 92].map((y, row) => (
      <g key={row}>
        {[238, 248, 258, 268].map((x, col) => (
          <rect key={col} x={x} y={y} width="6" height="6" rx="1" fill={row === 0 && col < 2 ? '#fbbf24' : '#fde68a'} />
        ))}
      </g>
    ))}
    {/* Tail */}
    <path d="M230 105Q245 85 235 100Q240 115 230 110" stroke="#f59e0b" strokeWidth="2" fill="none" />
  </svg>
);

const ReportsIllustration = () => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Main document */}
    <rect x="80" y="15" width="160" height="170" rx="10" fill="white" stroke="#e11d48" strokeWidth="2" />
    <rect x="80" y="15" width="160" height="30" rx="10" fill="#e11d48" />
    <rect x="80" y="35" width="160" height="10" fill="#e11d48" />
    <text x="120" y="35" fill="white" fontSize="11" fontWeight="bold">REPORTE</text>
    {/* Pie chart */}
    <circle cx="130" cy="80" r="22" fill="#fecdd3" />
    <path d="M130 58A22 22 0 0 1 152 80L130 80Z" fill="#e11d48" />
    <path d="M152 80A22 22 0 0 1 130 102L130 80Z" fill="#fb7185" />
    {/* Bar chart */}
    <rect x="170" y="68" width="10" height="25" rx="2" fill="#e11d48" opacity="0.5" />
    <rect x="185" y="58" width="10" height="35" rx="2" fill="#e11d48" opacity="0.7" />
    <rect x="200" y="48" width="10" height="45" rx="2" fill="#e11d48" />
    <rect x="215" y="63" width="10" height="30" rx="2" fill="#fb7185" />
    {/* Table rows */}
    {[110, 125, 140, 155, 170].map((y, i) => (
      <g key={i}>
        <line x1="90" y1={y} x2="230" y2={y} stroke="#fecdd3" strokeWidth="1" />
        <rect x="95" y={y + 3} width="40" height="5" rx="2" fill="#fda4af" opacity={0.8 - i * 0.1} />
        <rect x="145" y={y + 3} width="30" height="5" rx="2" fill="#fecdd3" />
        <rect x="185" y={y + 3} width="35" height="5" rx="2" fill="#fecdd3" />
      </g>
    ))}
    {/* Audit trail icon */}
    <rect x="250" y="100" width="40" height="50" rx="6" fill="#fff1f2" stroke="#e11d48" strokeWidth="1.5" />
    <path d="M258 115L265 122L282 108" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
    <rect x="258" y="130" width="24" height="4" rx="2" fill="#fda4af" />
    <rect x="258" y="138" width="18" height="4" rx="2" fill="#fecdd3" />
    {/* Magnifying glass */}
    <circle cx="55" cy="50" r="18" stroke="#e11d48" strokeWidth="2.5" fill="#fff1f2" />
    <line x1="67" y1="62" x2="78" y2="73" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
    <path d="M48 45L52 50L60 42" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const slides: Slide[] = [
  {
    title: 'Bienvenido a InvestIQ',
    description: 'Tu plataforma integral para la gestión inteligente de presupuestos e inversiones tecnológicas. Diseñada para ayudarte a tomar decisiones informadas, optimizar recursos y maximizar el impacto de cada inversión.',
    features: [
      'Visualiza el estado completo de tus presupuestos en tiempo real con dashboards interactivos',
      'Analiza tendencias y patrones de gasto para tomar decisiones estratégicas basadas en datos',
      'Controla cada aspecto de tus inversiones desde una única plataforma centralizada',
      'Colabora con tu equipo con roles y permisos personalizados',
    ],
    gradient: 'from-blue-500 via-indigo-600 to-purple-600',
    illustration: <DashboardIllustration />,
  },
  {
    title: 'Gestión de Presupuestos',
    description: 'Crea, edita y controla presupuestos con desglose mensual detallado. Compara versiones para entender la evolución de tus inversiones y asegura que cada peso esté asignado estratégicamente.',
    features: [
      'Líneas de presupuesto con distribución mensual editable y valores plan por período',
      'Comparación lado a lado entre versiones de presupuesto para rastrear cambios',
      'Gestión de ahorros identificados y diferidos entre períodos contables',
      'Solicitudes de cambio con flujo de aprobación integrado',
    ],
    gradient: 'from-emerald-500 to-emerald-700',
    illustration: <BudgetIllustration />,
  },
  {
    title: 'Transacciones',
    description: 'Registra y da seguimiento a todas las transacciones comprometidas y reales. Vincula automáticamente cada movimiento a sus líneas de presupuesto para mantener un control preciso del gasto.',
    features: [
      'Transacciones comprometidas para planificar gastos futuros con precisión',
      'Transacciones reales para registrar el gasto efectivo ejecutado',
      'Vinculación automática a líneas de presupuesto con cálculo de diferencias en tiempo real',
      'Filtros avanzados por empresa, moneda, categoría y período',
    ],
    gradient: 'from-violet-500 to-violet-700',
    illustration: <TransactionsIllustration />,
  },
  {
    title: 'Ahorros y Diferidos',
    description: 'Identifica oportunidades de ahorro y gestiona diferidos entre períodos. Optimiza la asignación de recursos redistribuyendo fondos de manera inteligente según las necesidades del negocio.',
    features: [
      'Registro de ahorros con distribución mensual y categorización por tipo',
      'Diferidos con rango de fechas para mover gastos entre períodos contables',
      'Impacto automático en el presupuesto al registrar ahorros o diferidos',
      'Reportes de ahorro acumulado por dirección tecnológica y categoría',
    ],
    gradient: 'from-amber-500 to-amber-700',
    illustration: <SavingsIllustration />,
  },
  {
    title: 'Reportes y Auditoría',
    description: 'Genera reportes detallados por sociedad, categoría y área. Mantén trazabilidad completa de cada cambio con el registro de auditoría integrado para cumplir con los estándares de gobernanza.',
    features: [
      'Reportes consolidados por sociedad financiera, categoría de gasto y área de usuario',
      'Reportes detallados con desglose mensual y comparativas entre períodos',
      'Exportación de datos para análisis externo en formatos estándar',
      'Registro de auditoría completo con trazabilidad de quién, qué y cuándo',
    ],
    gradient: 'from-rose-500 to-rose-700',
    illustration: <ReportsIllustration />,
  },
];

interface Props {
  onComplete: (dontShowAgain: boolean) => void;
}

export default function OnboardingSplash({ onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className={`h-2 bg-gradient-to-r ${slide.gradient}`} />

        {/* Skip button */}
        <button
          onClick={() => onComplete(dontShowAgain)}
          className="absolute top-5 right-5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
        >
          Omitir ✕
        </button>

        {/* Content: two columns */}
        <div className="flex flex-col md:flex-row">
          {/* Left: illustration */}
          <div className={`md:w-1/2 p-6 flex items-center justify-center bg-gradient-to-br ${slide.gradient} bg-opacity-5`}>
            <div className="w-full max-w-xs">
              {slide.illustration}
            </div>
          </div>

          {/* Right: text content */}
          <div className="md:w-1/2 px-8 pt-8 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{slide.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">{slide.description}</p>

            <div className="space-y-3 mb-6">
              {slide.features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full bg-gradient-to-r ${slide.gradient} flex-shrink-0`} />
                  <span className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Left: don't show again + dots */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">No volver a mostrar</span>
            </label>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current
                      ? `bg-gradient-to-r ${slide.gradient} scale-110`
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: navigation buttons */}
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => setCurrent(current - 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft />
                Anterior
              </button>
            )}
            {current < slides.length - 1 ? (
              <button
                onClick={() => setCurrent(current + 1)}
                className={`flex items-center gap-1 px-5 py-2 text-sm text-white rounded-lg bg-gradient-to-r ${slide.gradient} hover:opacity-90 transition-opacity`}
              >
                Siguiente
                <ArrowRight />
              </button>
            ) : (
              <button
                onClick={() => onComplete(dontShowAgain)}
                className={`flex items-center gap-1 px-5 py-2 text-sm text-white rounded-lg bg-gradient-to-r ${slide.gradient} hover:opacity-90 transition-opacity`}
              >
                Comenzar
                <ArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
