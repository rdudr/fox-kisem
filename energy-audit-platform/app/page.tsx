'use client';

import { useApp } from '@/context/AppContext';
import LoginForm from '@/components/LoginForm';
import CompanyInfoForm from '@/components/CompanyInfoForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { isAuthenticated, companyInfo } = useApp();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (!companyInfo) {
    return <CompanyInfoForm />;
  }

  return <Dashboard />;
}
