'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { machineConfig, getMachineNames } from '@/lib/machineConfig';
import { autoCalculate } from '@/lib/calculations';

export default function DataEntryForm() {
  const { userSession, companyInfo } = useApp();
  const [plant, setPlant] = useState('');
  const [machineType, setMachineType] = useState('');
  const [machineName, setMachineName] = useState('');
  const [formData, setFormData] = useState({
    frequency: '',
    ratedKW: '',
    ratedHP: '',
    voltage: '',
    current: '',
    powerFactor: '',
    notes: '',
  });
  const [calculated, setCalculated] = useState({
    kva: 0,
    kw: 0,
    kvar: 0,
    calculatedPower: 0,
    loadFactor: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const machineTypes = plant ? machineConfig.machineTypes[plant] || [] : [];
  const machineNames = plant && machineType ? getMachineNames(plant, machineType) : [];

  useEffect(() => {
    const { voltage, current, powerFactor, ratedKW } = formData;
    if (voltage && current && powerFactor && ratedKW) {
      const result = autoCalculate({
        voltage: parseFloat(voltage),
        current: parseFloat(current),
        powerFactor: parseFloat(powerFactor),
        ratedKW: parseFloat(ratedKW),
      });
      setCalculated(result);
    }
  }, [formData.voltage, formData.current, formData.powerFactor, formData.ratedKW]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/machine-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userSession?.username,
          username: userSession?.username,
          companyInfo,
          plant,
          machineType,
          machineName,
          frequency: parseFloat(formData.frequency),
          ratedKW: parseFloat(formData.ratedKW),
          ratedHP: parseFloat(formData.ratedHP),
          voltage: parseFloat(formData.voltage),
          current: parseFloat(formData.current),
          powerFactor: parseFloat(formData.powerFactor),
          notes: formData.notes,
          ...calculated,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          frequency: '',
          ratedKW: '',
          ratedHP: '',
          voltage: '',
          current: '',
          powerFactor: '',
          notes: '',
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-500 shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Machine Data Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plant / Department *
            </label>
            <select
              required
              value={plant}
              onChange={(e) => {
                setPlant(e.target.value);
                setMachineType('');
                setMachineName('');
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Plant</option>
              {machineConfig.plants.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Type *
            </label>
            <select
              required
              value={machineType}
              onChange={(e) => {
                setMachineType(e.target.value);
                setMachineName('');
              }}
              disabled={!plant}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Machine Type</option>
              {machineTypes.map((mt) => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Name *
            </label>
            <select
              required
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              disabled={!machineType}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Machine</option>
              {machineNames.map((mn) => (
                <option key={mn} value={mn}>{mn}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency (Hz) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rated kW *
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={formData.ratedKW}
              onChange={(e) => setFormData({ ...formData, ratedKW: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rated HP *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.ratedHP}
              onChange={(e) => setFormData({ ...formData, ratedHP: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voltage (V) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.voltage}
              onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current (I) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Power Factor *
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              required
              value={formData.powerFactor}
              onChange={(e) => setFormData({ ...formData, powerFactor: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">Auto-Calculated Values</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600">kVA:</span>
              <span className="ml-2 font-semibold text-blue-600">{calculated.kva.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">kW:</span>
              <span className="ml-2 font-semibold text-blue-600">{calculated.kw.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">kVAr:</span>
              <span className="ml-2 font-semibold text-blue-600">{calculated.kvar.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Calc. Power:</span>
              <span className="ml-2 font-semibold text-blue-600">{calculated.calculatedPower.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Load Factor:</span>
              <span className="ml-2 font-semibold text-blue-600">{calculated.loadFactor.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Data saved successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : 'Submit Data'}
        </button>
      </form>
    </div>
  );
}
