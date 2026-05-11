'use client';

import { useState } from 'react';
import { MachineData } from '@/lib/types';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { useApp } from '@/context/AppContext';

interface DataTableProps {
  data: MachineData[];
  onRefresh: () => void;
}

export default function DataTable({ data, onRefresh }: DataTableProps) {
  const { userSession, companyInfo } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterMachine, setFilterMachine] = useState('');

  const filteredData = data.filter((record) => {
    const matchesSearch = 
      record.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.plant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.machineType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlant = !filterPlant || record.plant === filterPlant;
    const matchesMachine = !filterMachine || record.machineType === filterMachine;

    return matchesSearch && matchesPlant && matchesMachine;
  });

  const plants = Array.from(new Set(data.map((d) => d.plant)));
  const machineTypes = Array.from(new Set(data.map((d) => d.machineType)));

  const exportToCSV = () => {
    const csvData = filteredData.map((record) => ({
      'Date': format(new Date(record.timestamp), 'yyyy-MM-dd'),
      'Time': format(new Date(record.timestamp), 'HH:mm:ss'),
      'Company Name': record.companyInfo.companyName,
      'Company Address': record.companyInfo.companyAddress,
      'Auditor': record.companyInfo.auditorName,
      'User': record.username,
      'Plant': record.plant,
      'Machine Type': record.machineType,
      'Machine Name': record.machineName,
      'Frequency (Hz)': record.frequency,
      'Rated kW': record.ratedKW,
      'Rated HP': record.ratedHP,
      'Voltage (V)': record.voltage,
      'Current (I)': record.current,
      'kVA': record.kva,
      'Power Factor': record.powerFactor,
      'kVAr': record.kvar,
      'kW': record.kw,
      'Calculated Power': record.calculatedPower,
      'Load Factor': record.loadFactor,
      'Notes': record.notes || '',
    }));

    const csv = Papa.unparse(csvData);
    
    const header = [
      `Energy Audit Report`,
      `Company: ${companyInfo?.companyName}`,
      `Address: ${companyInfo?.companyAddress}`,
      `Auditor: ${companyInfo?.auditorName}`,
      `User: ${userSession?.username}`,
      `Login Date: ${userSession?.loginDate}`,
      `Login Time: ${userSession?.loginTime}`,
      `Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
      `Total Records: ${filteredData.length}`,
      '',
    ].join('\n');

    const blob = new Blob([header + '\n' + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-audit-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    a.click();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-blue-600">Machine Data Records</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterPlant}
          onChange={(e) => setFilterPlant(e.target.value)}
          className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Plants</option>
          {plants.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterMachine}
          onChange={(e) => setFilterMachine(e.target.value)}
          className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Machine Types</option>
          {machineTypes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-blue-200">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date/Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Plant</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Machine</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Freq</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">V</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">I</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">kW</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">PF</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Load Factor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-100">
            {filteredData.map((record, idx) => (
              <tr key={record._id?.toString() || idx} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm')}
                </td>
                <td className="px-4 py-3 text-sm">{record.plant}</td>
                <td className="px-4 py-3 text-sm font-medium">{record.machineName}</td>
                <td className="px-4 py-3 text-sm">{record.frequency}</td>
                <td className="px-4 py-3 text-sm">{record.voltage.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm">{record.current.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm font-semibold">{record.kw.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{record.powerFactor.toFixed(3)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {record.loadFactor.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-gray-50">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-gray-500">No records found</p>
            <p className="text-sm text-gray-400">Start by entering machine data above</p>
          </div>
        )}
      </div>
    </div>
  );
}
