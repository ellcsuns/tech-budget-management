import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useTheme, COLOR_THEMES, FONT_SIZES } from '../contexts/ThemeContext';
import { changeRequestApi, budgetConfirmationApi, profileApi } from '../services/api';
import {
  HiOutlineLanguage,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from 'react-icons/hi2';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

export default function TopBar() {
  const { user, logout, refreshUser } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { darkMode, setDarkMode, colorTheme, setColorTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [confirmationPendingCount, setConfirmationPendingCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [crRes, bcRes] = await Promise.all([
          changeRequestApi.getPendingCount(),
          budgetConfirmationApi.getPendingCount()
        ]);
        setPendingCount(crRes.data.count || 0);
        setConfirmationPendingCount(bcRes.data.count || 0);
      } catch {
        setPendingCount(0);
        setConfirmationPendingCount(0);
      }
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
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowProfileEdit(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => { setShowLangMenu(false); setShowThemeMenu(false); setShowFontMenu(false); setShowUserMenu(false); };

  const handleLangChange = async (code: string) => {
    await setLocale(code);
    setShowLangMenu(false);
  };

  const openProfileEdit = () => {
    const parts = (user?.fullName || '').split(' ');
    setProfileFirstName(parts[0] || '');
    setProfileLastName(parts.slice(1).join(' ') || '');
    setShowProfileEdit(true);
    setShowUserMenu(false);
  };

  const handleProfileSave = async () => {
    const fullName = `${profileFirstName.trim()} ${profileLastName.trim()}`.trim();
    if (!fullName) return;
    setProfileSaving(true);
    try {
      await profileApi.updateProfile({ fullName });
      await refreshUser();
      setShowProfileEdit(false);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  // Icons
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

        {/* Approvals — always visible */}
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

        {/* Budget Confirmations — always visible */}
        <button onClick={() => navigate('/budgets')}
          className="relative flex items-center px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={t('budgetConfirmation.pendingBanner') || 'Confirmaciones de presupuesto pendientes'}>
          <HiOutlineCheckCircle className="w-5 h-5" />
          {confirmationPendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {confirmationPendingCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* User dropdown */}
        <div ref={userRef} className="relative">
          <button onClick={() => { closeAll(); setShowUserMenu(!showUserMenu); }}
            className="flex items-center gap-2 px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={user?.fullName || user?.username}>
            <HiOutlineUserGroup className="w-5 h-5" />
            <span className="text-sm font-medium max-w-[140px] truncate">{user?.fullName || user?.username}</span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <button onClick={openProfileEdit}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <HiOutlinePencilSquare className="w-4 h-4" />
                {t('topbar.editProfile') || 'Editar perfil'}
              </button>
              <button onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2">
                <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                {t('btn.logout') || 'Cerrar Sesión'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile edit modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowProfileEdit(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('topbar.editProfile') || 'Editar perfil'}</h3>
              <button onClick={() => setShowProfileEdit(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('topbar.email') || 'Correo electrónico'}</label>
                <input type="text" value={user?.email || ''} disabled
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('topbar.firstName') || 'Nombre'}</label>
                <input type="text" value={profileFirstName} onChange={e => setProfileFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('topbar.lastName') || 'Apellido'}</label>
                <input type="text" value={profileLastName} onChange={e => setProfileLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowProfileEdit(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {t('btn.cancel') || 'Cancelar'}
              </button>
              <button onClick={handleProfileSave} disabled={profileSaving || (!profileFirstName.trim() && !profileLastName.trim())}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
                {profileSaving ? (t('btn.saving') || 'Guardando...') : (t('btn.save') || 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
