import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useNotification } from '../NotificationContext';

const KPIForm = ({ isOpen, onClose, onSave, kpiData }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    indicatorCode: '',
    indicatorName: '',
    indicatorName_ar: '',
    category: 'patient-safety',
    reportingPeriod: 'Q1',
    reportingYear: new Date().getFullYear(),
    numerator: 0,
    denominator: 1,
    target: 0,
    calculatedValue: 0,
    status: 'on-track'
  });

  useEffect(() => {
    if (kpiData) {
      setFormData(kpiData);
    } else {
      setFormData({
        indicatorCode: '',
        indicatorName: '',
        indicatorName_ar: '',
        category: 'patient-safety',
        reportingPeriod: 'Q1',
        reportingYear: new Date().getFullYear(),
        numerator: 0,
        denominator: 1,
        target: 0,
        calculatedValue: 0,
        status: 'on-track'
      });
    }
  }, [kpiData, isOpen]);

  // Auto-calculate on input change
  useEffect(() => {
    const calc = (formData.numerator / (formData.denominator || 1)) * 100;
    const variance = calc - formData.target;
    let status = 'on-track';
    if (variance < 0 && variance >= -10) status = 'at-risk';
    else if (variance < -10) status = 'breached';

    setFormData(prev => ({
      ...prev,
      calculatedValue: parseFloat(calc.toFixed(2)),
      status: status
    }));
  }, [formData.numerator, formData.denominator, formData.target]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'numerator' || name === 'denominator' || name === 'target' || name === 'reportingYear') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (kpiData?._id) {
        await axios.put(`/api/kpi/${kpiData._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('KPI updated successfully', 'success');
      } else {
        await axios.post('/api/kpi', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('KPI created successfully', 'success');
      }
      onSave();
      onClose();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving KPI', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {kpiData ? 'Edit KPI Indicator' : 'New KPI Indicator'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Indicator Code</label>
              <input
                type="text"
                name="indicatorCode"
                value={formData.indicatorCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. PS-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="patient-safety">Patient Safety</option>
                <option value="clinical-effectiveness">Clinical Effectiveness</option>
                <option value="patient-experience">Patient Experience</option>
                <option value="efficiency">Efficiency</option>
                <option value="access">Access</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Indicator Name (EN)</label>
              <input
                type="text"
                name="indicatorName"
                value={formData.indicatorName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 text-right">اسم المؤشر (AR)</label>
              <input
                type="text"
                name="indicatorName_ar"
                value={formData.indicatorName_ar}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reporting Period</label>
              <select
                name="reportingPeriod"
                value={formData.reportingPeriod}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
              <input
                type="number"
                name="reportingYear"
                value={formData.reportingYear}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Numerator</label>
              <input
                type="number"
                name="numerator"
                value={formData.numerator}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Denominator</label>
              <input
                type="number"
                name="denominator"
                value={formData.denominator}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target %</label>
              <input
                type="number"
                name="target"
                value={formData.target}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl">
            <div>
              <p className="text-sm text-slate-500">Calculated Value</p>
              <p className="text-2xl font-bold text-blue-600">{formData.calculatedValue}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                formData.status === 'on-track' ? 'bg-green-100 text-green-700' :
                formData.status === 'at-risk' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {formData.status.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {kpiData ? 'Update Indicator' : 'Create Indicator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KPIForm;
