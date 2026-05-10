import React, { useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { useNotification } from '../NotificationContext';

const KPIExportButton = ({ period, year }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/kpi/export/excel`, {
        params: { period, year },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KPI_Report_${period || 'All'}_${year || 'All'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Excel export started', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export Excel', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Exporting...' : 'Export Excel'}
    </button>
  );
};

export default KPIExportButton;
