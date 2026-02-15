import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';

const THEMES = [
  { id: 'default', name: 'Azul Corporativo', primary: '#1E40AF', sidebar: '#111827', accent: '#3B82F6' },
  { id: 'green', name: 'Verde Naturaleza', primary: '#065F46', sidebar: '#064E3B', accent: '#10B981' },
  { id: 'purple', name: 'Púrpura Elegante', primary: '#5B21B6', sidebar: '#1E1B4B', accent: '#8B5CF6' },
  { id: 'red', name: 'Rojo Ejecutivo', primary: '#991B1B', sidebar: '#1C1917', accent: '#EF4444' },
  { id: 'teal', name: 'Teal Moderno', primary: '#0F766E', sidebar: '#134E4A', accent: '#14B8A6' },
  { id: 'orange', name: 'Naranja Energético', primary: '#9A3412', sidebar: '#1C1917', accent: '#F97316' },
];

const FONT_SIZES = [
  { id: 'xs', label: 'Muy pequeño', scale: 0.8 },
  { id: 'sm', label: 'Pequeño', scale: 0.9 },
  { id: 'md', label: 'Normal', scale: 1.0 },
  { id: 'lg', label: 'Grande', scale: 1.1 },
  { id: 'xl', label: 'Muy grande', scale: 1.2 },
];

export default function ConfigurationPage() {
  const { locale, setLocale, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState('default');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState('md');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) setCurrentTheme(savedTheme);
    const savedFont = localStorage.getItem('app_font_size');
    if (savedFont) setFontSize(savedFont);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-sidebar', theme.sidebar);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
    localStorage.setItem('app_theme', themeId);
    setCurrentTheme(themeId);
  };

  const applyFontSize = (sizeId: string) => {
    const size = FONT_SIZES.find(s => s.id === sizeId);
    if (!size) return;
    document.documentElement.style.fontSize = `${size.scale * 16}px`;
    localStorage.setItem('app_font_size', sizeId);
    setFontSize(sizeId);
  };

  const previewData = previewTheme ? THEMES.find(t => t.id === previewTheme) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{t('menu.configuration') || 'Configuración'}</h1>

      {/* Language Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.language') || 'Idioma'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.language_desc') || 'Selecciona el idioma de la interfaz.'}</p>
        <div className="flex gap-4">
          <button onClick={() => setLocale('es')}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${locale === 'es' ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}>
            <span className="text-2xl mr-2">🇪🇸</span>
            <span className="font-medium">Español</span>
          </button>
          <button onClick={() => setLocale('en')}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${locale === 'en' ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}>
            <span className="text-2xl mr-2">🇺🇸</span>
            <span className="font-medium">English</span>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.font_size') || 'Tamaño de Texto'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.font_size_desc') || 'Ajusta el tamaño del texto en toda la aplicación.'}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">A</span>
          <div className="flex gap-2">
            {FONT_SIZES.map(size => (
              <button
                key={size.id}
                onClick={() => applyFontSize(size.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${fontSize === size.id ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <span style={{ fontSize: `${size.scale * 14}px` }} className="font-medium">{size.label}</span>
              </button>
            ))}
          </div>
          <span className="text-xl text-gray-400">A</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Vista previa: <span style={{ fontSize: `${(FONT_SIZES.find(s => s.id === fontSize)?.scale || 1) * 14}px` }}>Este es un texto de ejemplo con el tamaño seleccionado.</span></p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-xl font-bold mb-4">{t('config.theme') || 'Paleta de Colores / Tema'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.theme_desc') || 'Selecciona un tema. Pasa el cursor para ver un preview.'}</p>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              onMouseEnter={() => setPreviewTheme(theme.id)}
              onMouseLeave={() => setPreviewTheme(null)}
              className={`p-4 rounded-lg border-2 transition-all ${currentTheme === theme.id ? 'border-accent ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.sidebar }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />
              </div>
              <p className="text-sm font-medium text-gray-800">{theme.name}</p>
              {currentTheme === theme.id && <p className="text-xs text-accent mt-1">✓ Activo</p>}
            </button>
          ))}
        </div>

        {previewData && (
          <div className="absolute right-0 top-16 w-72 bg-white rounded-lg shadow-xl border p-4 z-50">
            <p className="text-sm font-bold mb-3">Preview: {previewData.name}</p>
            <div className="rounded-lg overflow-hidden mb-3" style={{ backgroundColor: previewData.sidebar }}>
              <div className="p-3 border-b border-gray-600">
                <p className="text-white text-sm font-bold">Tech Budget</p>
              </div>
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 rounded text-white text-xs" style={{ backgroundColor: previewData.accent }}>Dashboard</div>
                <div className="px-3 py-2 rounded text-gray-300 text-xs">Presupuestos</div>
                <div className="px-3 py-2 rounded text-gray-300 text-xs">Gastos</div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: previewData.primary }}>Guardar</button>
              <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: previewData.accent }}>Editar</button>
              <button className="px-3 py-1 text-xs rounded border" style={{ borderColor: previewData.accent, color: previewData.accent }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.system_info') || 'Información del Sistema'}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Aplicación:</span> <span className="font-medium">Tech Budget Management</span></div>
          <div><span className="text-gray-500">Versión:</span> <span className="font-medium">2.0.0</span></div>
          <div><span className="text-gray-500">Backend:</span> <span className="font-medium">Node.js + Express + Prisma</span></div>
          <div><span className="text-gray-500">Frontend:</span> <span className="font-medium">React + TypeScript + Tailwind</span></div>
          <div><span className="text-gray-500">Base de Datos:</span> <span className="font-medium">PostgreSQL</span></div>
          <div><span className="text-gray-500">Hosting:</span> <span className="font-medium">AWS EC2</span></div>
        </div>
      </div>
    </div>
  );
}
