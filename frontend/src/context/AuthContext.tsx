import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi, getMeApi } from '../services/api';

const DEFAULT_ADMIN_USER: User = {
  id: 1,
  username: 'admin',
  email: 'admin@greenheights.smart',
  full_name: 'Shreeyut',
  role: 'admin',
  household_id: null,
  phone_number: '+91 98111 00001',
  is_active: true,
  created_at: new Date().toISOString(),
};

const ROLE_USERS: Record<UserRole, User> = {
  admin: DEFAULT_ADMIN_USER,
  maintenance: {
    id: 2,
    username: 'technician',
    email: 'maintenance@greenheights.smart',
    full_name: 'Ramesh Kumar (Lead Hydraulic Tech)',
    role: 'maintenance',
    household_id: null,
    phone_number: '+91 98111 00002',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  resident: {
    id: 3,
    username: 'resident',
    email: 'resident@greenheights.smart',
    full_name: 'Aarav Sharma (Resident Apt A-101)',
    role: 'resident',
    household_id: 1,
    phone_number: '+91 98765 10000',
    is_active: true,
    created_at: new Date().toISOString(),
  },
};

interface AuthContextType {
  user: User;
  token: string | null;
  role: UserRole;
  login: (username: string, pass: string) => Promise<boolean>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_ADMIN_USER);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const resp = await getMeApi();
          setUser(resp.data);
          return;
        } catch (err) {
          console.warn('Stored token expired or invalid, auto-logging in default admin', err);
        }
      }
      // Ensure backend session token is initialized seamlessly
      await switchDemoRole('admin');
    };
    initAuth();
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await loginApi(username, pass);
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.warn('Login request failed, maintaining local role state', err);
      return false;
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const roleCredentials: Record<UserRole, { u: string; p: string }> = {
      admin: { u: 'admin', p: 'admin123' },
      maintenance: { u: 'technician', p: 'tech123' },
      resident: { u: 'resident', p: 'resident123' },
    };

    // Set UI state immediately
    setUser(ROLE_USERS[targetRole]);

    // Acquire corresponding backend JWT token
    const creds = roleCredentials[targetRole];
    await login(creds.u, creds.p);
  };

  const logout = () => {
    // Reset back to admin directly without any login screen
    switchDemoRole('admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user.role,
        login,
        switchDemoRole,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
