import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (saved) setTokenState(saved);
  }, []);

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(t);
  };

  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

