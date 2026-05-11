'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, CompanyInfo } from '@/lib/types';

interface AppContextType {
  userSession: UserSession | null;
  setUserSession: (session: UserSession | null) => void;
  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    const savedCompany = localStorage.getItem('companyInfo');
    
    if (savedSession) {
      setUserSession(JSON.parse(savedSession));
    }
    if (savedCompany) {
      setCompanyInfo(JSON.parse(savedCompany));
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      localStorage.setItem('userSession', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('userSession');
    }
  }, [userSession]);

  useEffect(() => {
    if (companyInfo) {
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    } else {
      localStorage.removeItem('companyInfo');
    }
  }, [companyInfo]);

  const logout = () => {
    setUserSession(null);
    setCompanyInfo(null);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        userSession,
        setUserSession,
        companyInfo,
        setCompanyInfo,
        isAuthenticated: !!userSession,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
