import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { setCanViewTechnicalErrors } from '../components/Toast';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  active?: boolean;
  technologyDirectionId?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  roles?: { id: string; name: string; description: string }[];
  userRoles?: { role: { id: string; name: string; description: string } }[];
}

interface Permission {
  menuCode: string;
  permissionType: 'VIEW' | 'MODIFY' | 'VIEW_OWN' | 'MODIFY_OWN' | 'APPROVE_BUDGET';
}

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  canViewTechnicalErrors: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (menuCode: string, permissionType: 'VIEW' | 'MODIFY' | 'VIEW_OWN' | 'MODIFY_OWN' | 'APPROVE_BUDGET') => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canViewTechErrors, setCanViewTechErrors] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      validateAndLoadUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCanViewTechnicalErrors(canViewTechErrors);
  }, [canViewTechErrors]);

  const validateAndLoadUser = async (_token: string) => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setPermissions(response.data.permissions || []);
      setCanViewTechErrors(response.data.canViewTechnicalErrors || false);
    } catch (error) {
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
    setPermissions(response.data.permissions || []);
    setCanViewTechErrors(response.data.canViewTechnicalErrors || false);
  };

  const logout = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    setPermissions([]);
    setCanViewTechErrors(false);
  };

  const hasPermission = (menuCode: string, permissionType: 'VIEW' | 'MODIFY' | 'VIEW_OWN' | 'MODIFY_OWN' | 'APPROVE_BUDGET'): boolean => {
    return permissions.some(
      p => p.menuCode === menuCode && p.permissionType === permissionType
    );
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setPermissions(response.data.permissions || []);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated: !!user, isLoading, canViewTechnicalErrors: canViewTechErrors, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
