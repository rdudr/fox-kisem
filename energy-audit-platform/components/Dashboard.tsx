'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DataEntryForm from './DataEntryForm';
import DataTable from './DataTable';
import { MachineData } from '@/lib/types';

export default function Dashboard() {
  const { userSession, companyInfo, logout } = useApp();
  const [data, setData] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    avgLoadFactor: 0,
    totalPower: 0,
  });

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/machine-data?username=${userSession?.username}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        calculateStats(result.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: MachineData[]) => {
    const totalRecords = records.length;
    const avgLoadFactor = records.length > 0
      ? records.reduce((sum, r) => sum + r.loadFactor, 0) / records.length
      : 0;
    const totalPower = records.reduce((sum, r) => sum + r.calculatedPower, 0);

    setStats({ totalRecords, avgLoadFactor, totalPower });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Energy Audit Platform</h1>
              <p className="text-sm text-blue-100 mt-1">
                {companyInfo?.companyName} | Operator: {companyInfo?.auditorName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">User: {userSession?.username}</p>
              <p className="text-xs text-blue-100">
                Login: {userSession?.loginDate} {userSession?.loginTime}
              </p>
              <button
                onClick={logout}
                className="mt-2 text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalRecords}</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600">Avg Load Factor</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.avgLoadFactor.toFixed(3)}
            </p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Power (kW)</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.totalPower.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <DataEntryForm />
        </div>

        <div>
          <DataTable data={data} onRefresh={fetchData} />
        </div>
      </main>
    </div>
  );
}
