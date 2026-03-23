import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useTheme, COLOR_THEMES, FONT_SIZES } from '../contexts/ThemeContext';
import { changeRequestApi } from '../services/api';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineLanguage,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

export default function TopBar() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { darkMode, setDarkMode, colorTheme, setColorTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFontMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => { setShowLangMenu(false); setShowThemeMenu(false); setShowFontMenu(false); };

  const handleLangChange = async (code: string) => {
    await setLocale(code);
    setShowLangMenu(false);
  };

  // Sun/Moon icon for dark mode toggle
  const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
  const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
  // Palette icon for color theme
  const PaletteIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );

  return (
    <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
      <div />
      <div className="flex items-center gap-1">
        {/* Language */}
        <div ref={langRef} className="relative">
          <button onClick={() => { closeAll(); setShowLangMenu(!showLangMenu); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('topbar.language') || 'Idioma'}>
            <HiOutlineLanguage className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">{locale}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => handleLangChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${locale === lang.code ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-700 dark:text-gray-300'}`}>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <div ref={fontRef} className="relative">
          <button onClick={() => { closeAll(); setShowFontMenu(!showFontMenu); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('topbar.fontSize') || 'Tamaño de texto'}>
            <HiOutlineMagnifyingGlass className="w-5 h-5" />
          </button>
          {showFontMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
              {FONT_SIZES.map(fs => (
                <button key={fs.id} onClick={() => { setFontSize(fs.id); setShowFontMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${fontSize === fs.id ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-700 dark:text-gray-300'}`}>
                  {fs.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color theme */}
        <div ref={themeRef} className="relative">
          <button onClick={() => { closeAll(); setShowThemeMenu(!showThemeMenu); }}
            className="flex items-center px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('topbar.theme') || 'Paleta de colores'}>
            <PaletteIcon />
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[180px]">
              {COLOR_THEMES.map(theme => (
                <button key={theme.id} onClick={() => { setColorTheme(theme.id); setShowThemeMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${colorTheme === theme.id ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-700 dark:text-gray-300'}`}>
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

        {/* Dark mode toggle */}
        <button onClick={() => setDarkMode(darkMode === 'dark' ? 'light' : 'dark')}
          className="flex items-center px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={darkMode === 'dark' ? (t('topbar.lightMode') || 'Modo claro') : (t('topbar.darkMode') || 'Modo oscuro')}>
          {darkMode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* Approvals */}
        <button onClick={() => navigate('/approvals')}
          className="relative flex items-center px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={t('topbar.notifications') || 'Aprobaciones pendientes'}>
          <HiOutlineClipboardDocumentList className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2 px-2">
          <HiOutlineUserGroup className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-[120px] truncate">{user?.fullName || user?.username}</span>
        </div>

        {/* Logout */}
        <button onClick={logout}
          className="flex items-center px-2.5 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-colors"
          title={t('btn.logout') || 'Cerrar Sesión'}>
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
