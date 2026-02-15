import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translationApi, configApi } from '../services/api';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>('es');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadTranslations = useCallback(async (loc: string) => {
    try {
      const res = await translationApi.getByLocale(loc);
      setTranslations(res.data);
    } catch {
      console.error('Failed to load translations');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await configApi.get('locale');
        const loc = res.data?.value || 'es';
        setLocaleState(loc);
        await loadTranslations(loc);
      } catch {
        await loadTranslations('es');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTranslations]);

  const setLocale = async (newLocale: string) => {
    try {
      await configApi.set('locale', newLocale);
      setLocaleState(newLocale);
      await loadTranslations(newLocale);
    } catch {
      console.error('Failed to set locale');
    }
  };

  const t = useCallback((key: string): string => {
    return translations[key] || key;
  }, [translations]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
