import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { budgetApi } from '../services/api';
import type { Budget } from '../types';

interface ActiveBudgetContextType {
  activeBudget: Budget | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ActiveBudgetContext = createContext<ActiveBudgetContextType | undefined>(undefined);

export function ActiveBudgetProvider({ children }: { children: ReactNode }) {
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await budgetApi.getActive();
      setActiveBudget(res.data);
    } catch {
      setActiveBudget(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ActiveBudgetContext.Provider value={{ activeBudget, loading, refresh }}>
      {children}
    </ActiveBudgetContext.Provider>
  );
}

export function useActiveBudget() {
  const context = useContext(ActiveBudgetContext);
  if (!context) throw new Error('useActiveBudget must be used within ActiveBudgetProvider');
  return context;
}
