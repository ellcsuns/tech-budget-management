import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { changeRequestApi } from '../services/api';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineLanguage,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

const THEMES = [
  { id: 'default', label: 'Predeterminado', colors: ['#1e293b', '#3b82f6', '#6366f1'] },
  { id: 'ocean', label: 'Océano', colors: ['#0c4a6e', '#0ea5e9', '#06b6d4'] },
  { id: 'forest', label: 'Bosque', colors: ['#14532d', '#22c55e', '#10b981'] },
  { id: 'sunset', label: 'Atardecer', colors: ['#7c2d12', '#f97316', '#ef4444'] },
];

const FONT_SIZES = [
  { id: 'sm', label: 'Pequeño', scale: 0.875 },
  { id: 'md', label: 'Normal', scale: 1 },
  { id: 'lg', label: 'Grande', scale: 1.125 },
  { id: 'xl', label: 'Extra Grande', scale: 1.25 },
];

export default function TopBar() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('app_theme') || 'default');
  const [currentFontSize, setCurrentFontSize] = useState(() => localStorage.getItem('app_font_size') || 'md');

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

  // Load pending approvals count
  useEffect(() => {
    const load = async () => {
      try {
        const res = await changeRequestApi.getPendingCount();
        setPendingCount(res.data.count || 0);
      } catch { setPendingCount(0); }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apply font size
  useEffect(() => {
    const size = FONT_SIZES.find(f => f.id === currentFontSize);
    if (size) {
      document.documentElement.style.fontSize = `${size.scale * 16}px`;
      localStorage.setItem('app_font_size', currentFontSize);
    }
  }, [currentFontSize]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app_theme', currentTheme);
  }, [currentTheme]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFontMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLangChange = async (code: string) => {
    await setLocale(code);
    setShowLangMenu(false);
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: page context (empty, can be used for breadcrumbs) */}
      <div />

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Language selector */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowThemeMenu(false); setShowFontMenu(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('topbar.language') || 'Idioma'}
          >
            <HiOutlineLanguage className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">{locale}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === lang.code ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <div ref={fontRef} className="relative">
          <button
            onClick={() => { setShowFontMenu(!showFontMenu); setShowLangMenu(false); setShowThemeMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('topbar.fontSize') || 'Tamaño de texto'}
          >
            {currentFontSize === 'sm' || currentFontSize === 'md' ? (
              <HiOutlineMagnifyingGlass className="w-5 h-5" />
            ) : (
              <HiOutlineMagnifyingGlass className="w-5 h-5" />
            )}
          </button>
          {showFontMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
              {FONT_SIZES.map(fs => (
                <button
                  key={fs.id}
                  onClick={() => { setCurrentFontSize(fs.id); setShowFontMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${currentFontSize === fs.id ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme/palette */}
        <div ref={themeRef} className="relative">
          <button
            onClick={() => { setShowThemeMenu(!showThemeMenu); setShowLangMenu(false); setShowFontMenu(false); }}
            className="flex items-center px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('topbar.theme') || 'Paleta de colores'}
          >
            <HiOutlineStar className="w-5 h-5" />
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[180px]">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => { setCurrentTheme(theme.id); setShowThemeMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${currentTheme === theme.id ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                >
                  <div className="flex gap-1">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {theme.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Notifications / Approvals bell */}
        <button
          onClick={() => navigate('/approvals')}
          className="relative flex items-center px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title={t('topbar.notifications') || 'Aprobaciones pendientes'}
        >
          <HiOutlineClipboardDocumentList className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User info */}
        <div className="flex items-center gap-2 px-2">
          <HiOutlineUserGroup className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">{user?.fullName || user?.username}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center px-2.5 py-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          title={t('btn.logout') || 'Cerrar Sesión'}
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
