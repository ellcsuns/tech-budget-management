import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { userPreferenceApi } from '../services/api';
import { useAuth } from './AuthContext';

export interface ColorTheme {
  id: string;
  label: string;
  colors: string[];
  primary: string;
  sidebar: string;
  accent: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'default', label: 'Predeterminado', colors: ['#1e293b', '#3b82f6', '#6366f1'], primary: '#1E40AF', sidebar: '#111827', accent: '#3B82F6' },
  { id: 'ocean', label: 'Océano', colors: ['#0c4a6e', '#0ea5e9', '#06b6d4'], primary: '#0c4a6e', sidebar: '#0c4a6e', accent: '#0ea5e9' },
  { id: 'forest', label: 'Bosque', colors: ['#14532d', '#22c55e', '#10b981'], primary: '#065F46', sidebar: '#064E3B', accent: '#10B981' },
  { id: 'sunset', label: 'Atardecer', colors: ['#7c2d12', '#f97316', '#ef4444'], primary: '#9A3412', sidebar: '#1C1917', accent: '#F97316' },
  { id: 'green', label: 'Verde', colors: ['#065F46', '#10B981', '#064E3B'], primary: '#065F46', sidebar: '#064E3B', accent: '#10B981' },
  { id: 'purple', label: 'Púrpura', colors: ['#5B21B6', '#8B5CF6', '#1E1B4B'], primary: '#5B21B6', sidebar: '#1E1B4B', accent: '#8B5CF6' },
  { id: 'red', label: 'Rojo', colors: ['#991B1B', '#EF4444', '#1C1917'], primary: '#991B1B', sidebar: '#1C1917', accent: '#EF4444' },
  { id: 'teal', label: 'Teal', colors: ['#0F766E', '#14B8A6', '#134E4A'], primary: '#0F766E', sidebar: '#134E4A', accent: '#14B8A6' },
  { id: 'orange', label: 'Naranja', colors: ['#9A3412', '#F97316', '#1C1917'], primary: '#9A3412', sidebar: '#1C1917', accent: '#F97316' },
];

export const FONT_SIZES = [
  { id: 'sm', label: 'Pequeño', scale: 0.875 },
  { id: 'md', label: 'Normal', scale: 1 },
  { id: 'lg', label: 'Grande', scale: 1.125 },
  { id: 'xl', label: 'Extra Grande', scale: 1.25 },
];

type DarkMode = 'light' | 'dark';

interface ThemeContextType {
  darkMode: DarkMode;
  setDarkMode: (mode: DarkMode) => void;
  colorTheme: string;
  setColorTheme: (id: string) => void;
  fontSize: string;
  setFontSize: (id: string) => void;
  prefsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyColorTheme(themeId: string) {
  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-sidebar', theme.sidebar);
  document.documentElement.style.setProperty('--color-accent', theme.accent);
  document.documentElement.setAttribute('data-theme', themeId);
}

function applyFontSize(sizeId: string) {
  const size = FONT_SIZES.find(f => f.id === sizeId) || FONT_SIZES[1];
  document.documentElement.style.fontSize = `${size.scale * 16}px`;
}

function applyDarkMode(mode: DarkMode) {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState<DarkMode>(() => {
    return (localStorage.getItem('app_dark_mode') as DarkMode) || 'light';
  });
  const [colorTheme, setColorThemeState] = useState(() => localStorage.getItem('app_theme') || 'default');
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('app_font_size') || 'md');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load preferences from backend when user logs in
  useEffect(() => {
    if (!user?.id) { setPrefsLoaded(true); return; }
    const load = async () => {
      try {
        const res = await userPreferenceApi.getAll();
        const prefs = res.data;
        if (prefs.darkMode) { setDarkModeState(prefs.darkMode as DarkMode); localStorage.setItem('app_dark_mode', prefs.darkMode); }
        if (prefs.colorTheme) { setColorThemeState(prefs.colorTheme); localStorage.setItem('app_theme', prefs.colorTheme); }
        if (prefs.fontSize) { setFontSizeState(prefs.fontSize); localStorage.setItem('app_font_size', prefs.fontSize); }
      } catch { /* use localStorage defaults */ }
      setPrefsLoaded(true);
    };
    load();
  }, [user?.id]);

  // Apply effects
  useEffect(() => { applyDarkMode(darkMode); }, [darkMode]);
  useEffect(() => { applyColorTheme(colorTheme); }, [colorTheme]);
  useEffect(() => { applyFontSize(fontSize); }, [fontSize]);

  const saveToBackend = useCallback((key: string, value: string) => {
    if (user?.id) {
      userPreferenceApi.save({ [key]: value }).catch(() => {});
    }
  }, [user?.id]);

  const setDarkMode = (mode: DarkMode) => {
    setDarkModeState(mode);
    localStorage.setItem('app_dark_mode', mode);
    saveToBackend('darkMode', mode);
  };

  const setColorTheme = (id: string) => {
    setColorThemeState(id);
    localStorage.setItem('app_theme', id);
    saveToBackend('colorTheme', id);
  };

  const setFontSize = (id: string) => {
    setFontSizeState(id);
    localStorage.setItem('app_font_size', id);
    saveToBackend('fontSize', id);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, colorTheme, setColorTheme, fontSize, setFontSize, prefsLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
