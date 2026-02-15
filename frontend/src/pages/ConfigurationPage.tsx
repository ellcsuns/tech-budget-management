import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'default', name: 'Azul Corporativo', primary: '#1E40AF', sidebar: '#111827', accent: '#3B82F6' },
  { id: 'green', name: 'Verde Naturaleza', primary: '#065F46', sidebar: '#064E3B', accent: '#10B981' },
  { id: 'purple', name: 'Púrpura Elegante', primary: '#5B21B6', sidebar: '#1E1B4B', accent: '#8B5CF6' },
  { id: 'red', name: 'Rojo Ejecutivo', primary: '#991B1B', sidebar: '#1C1917', accent: '#EF4444' },
  { id: 'teal', name: 'Teal Moderno', primary: '#0F766E', sidebar: '#134E4A', accent: '#14B8A6' },
  { id: 'orange', name: 'Naranja Energético', primary: '#9A3412', sidebar: '#1C1917', accent: '#F97316' },
];

export default function ConfigurationPage() {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved) setCurrentTheme(saved);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>

      {/* Theme Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Paleta de Colores / Tema</h2>
        <p className="text-sm text-gray-600 mb-4">Selecciona un tema para personalizar la apariencia de la aplicación.</p>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all ${currentTheme === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.sidebar }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />
              </div>
              <p className="text-sm font-medium text-gray-800">{theme.name}</p>
              {currentTheme === theme.id && <p className="text-xs text-blue-600 mt-1">✓ Activo</p>}
            </button>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Información del Sistema</h2>
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
