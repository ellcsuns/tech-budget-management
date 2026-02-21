import { useState } from 'react';
import {
  HiOutlineChartBarSquare,
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentChartBar,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { IconType } from 'react-icons';

interface Slide {
  icon: IconType;
  secondaryIcon?: IconType;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  iconBg: string;
}

const slides: Slide[] = [
  {
    icon: HiOutlineChartBarSquare,
    title: 'Dashboard Interactivo',
    description: 'Visualiza el estado completo de tus presupuestos tecnológicos en tiempo real.',
    features: [
      'Resumen de presupuesto vs ejecutado',
      'Filtros por moneda, sociedad y categoría',
      'Detalle de líneas con un click',
    ],
    gradient: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    icon: HiOutlineBanknotes,
    title: 'Gestión de Presupuestos',
    description: 'Crea, edita y controla presupuestos con desglose mensual detallado.',
    features: [
      'Líneas de presupuesto con distribución mensual',
      'Comparación entre versiones',
      'Ahorros y diferidos integrados',
    ],
    gradient: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: HiOutlineLockClosed,
    secondaryIcon: HiOutlineCheckCircle,
    title: 'Transacciones',
    description: 'Registra y da seguimiento a transacciones comprometidas y reales.',
    features: [
      'Transacciones comprometidas y reales',
      'Vinculación automática a líneas de presupuesto',
      'Diferencias calculadas en tiempo real',
    ],
    gradient: 'from-violet-500 to-violet-700',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    icon: HiOutlineCurrencyDollar,
    title: 'Ahorros y Diferidos',
    description: 'Gestiona ahorros identificados y diferidos entre períodos.',
    features: [
      'Registro de ahorros con distribución mensual',
      'Diferidos con rango de fechas',
      'Filtros avanzados por categoría',
    ],
    gradient: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    icon: HiOutlineDocumentChartBar,
    title: 'Reportes y Auditoría',
    description: 'Genera reportes detallados y mantén trazabilidad completa.',
    features: [
      'Reportes por sociedad, categoría y área',
      'Exportación de datos',
      'Registro de auditoría de cambios',
    ],
    gradient: 'from-rose-500 to-rose-700',
    iconBg: 'bg-rose-100 text-rose-600',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingSplash({ onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className={`h-2 bg-gradient-to-r ${slide.gradient}`} />

        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-5 right-5 text-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          Omitir
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl ${slide.iconBg} flex items-center justify-center`}>
              <Icon className="w-10 h-10" />
            </div>
          </div>

          {/* Title & description */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{slide.title}</h2>
          <p className="text-gray-500 text-center mb-6">{slide.description}</p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {slide.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full bg-gradient-to-r ${slide.gradient} flex-shrink-0`} />
                <span className="text-gray-600 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: dots + navigation */}
        <div className="px-8 pb-8 flex items-center justify-between">
          {/* Dots */}
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

          {/* Buttons */}
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => setCurrent(current - 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            )}
            {current < slides.length - 1 ? (
              <button
                onClick={() => setCurrent(current + 1)}
                className={`flex items-center gap-1 px-5 py-2 text-sm text-white rounded-lg bg-gradient-to-r ${slide.gradient} hover:opacity-90 transition-opacity`}
              >
                Siguiente
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className={`flex items-center gap-1 px-5 py-2 text-sm text-white rounded-lg bg-gradient-to-r ${slide.gradient} hover:opacity-90 transition-opacity`}
              >
                Comenzar
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
