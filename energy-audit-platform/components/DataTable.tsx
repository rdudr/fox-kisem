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
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-600">Machine Data Records</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date/Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Plant</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Machine</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Freq</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">V</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">I</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">kW</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">PF</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase">Load Factor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-100">
            {filteredData.map((record, idx) => (
              <tr key={record._id?.toString() || idx} className="hover:bg-blue-50">
                <td className="px-4 py-3 text-sm">
                  {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm')}
                </td>
                <td className="px-4 py-3 text-sm">{record.plant}</td>
                <td className="px-4 py-3 text-sm">{record.machineName}</td>
                <td className="px-4 py-3 text-sm">{record.frequency}</td>
                <td className="px-4 py-3 text-sm">{record.voltage.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm">{record.current.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{record.kw.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{record.powerFactor.toFixed(3)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                  {record.loadFactor.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No records found
          </div>
        )}
      </div>
    </div>
  );
}
