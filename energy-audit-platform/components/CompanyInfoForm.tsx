'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CompanyInfo } from '@/lib/types';

export default function CompanyInfoForm() {
  const { setCompanyInfo } = useApp();
  const [formData, setFormData] = useState<CompanyInfo>({
    companyName: '',
    companyAddress: '',
    auditorName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyInfo(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white border-2 border-blue-500 rounded-lg shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-blue-600">
            Company Information
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please provide company details for audit records
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                Company Address *
              </label>
              <textarea
                id="companyAddress"
                required
                rows={3}
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="auditorName" className="block text-sm font-medium text-gray-700">
                Auditor/Operator Name *
              </label>
              <input
                id="auditorName"
                type="text"
                required
                value={formData.auditorName}
                onChange={(e) =>
                  setFormData({ ...formData, auditorName: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
