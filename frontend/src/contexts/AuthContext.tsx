import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

interface Permission {
  menuCode: string;
  permissionType: 'VIEW' | 'MODIFY';
}

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (menuCode: string, permissionType: 'VIEW' | 'MODIFY') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from stored token on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      validateAndLoadUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateAndLoadUser = async (_token: string) => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setPermissions(response.data.permissions || []);
    } catch (error) {
      // Token is invalid, clear it
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
  };

  const logout = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (menuCode: string, permissionType: 'VIEW' | 'MODIFY'): boolean => {
    return permissions.some(
      p => p.menuCode === menuCode && p.permissionType === permissionType
    );
  };

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated: !!user, isLoading, login, logout, hasPermission }}>
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
