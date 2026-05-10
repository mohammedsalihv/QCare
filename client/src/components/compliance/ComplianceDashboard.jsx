import React from 'react';
import { ShieldAlert, FileWarning, ClipboardCheck, Percent } from 'lucide-react';

const ComplianceDashboard = ({ stats }) => {
  const cards = [
    { 
      label: 'Expiring < 30 Days', 
      value: stats?.expiring30 || 0, 
      icon: ShieldAlert, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      description: 'Critical action required'
    },
    { 
      label: 'Expiring < 60 Days', 
      value: stats?.expiring60 || 0, 
      icon: FileWarning, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      description: 'Plan for renewals'
    },
    { 
      label: 'Overdue Circulars', 
      value: stats?.pendingCirculars || 0, 
      icon: ClipboardCheck, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'Pending acknowledgments'
    },
    { 
      label: 'Overall Compliance', 
      value: `${stats?.compliancePercent || 100}%`, 
      icon: Percent, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Active license ratio'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{card.value}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-[10px] text-slate-400 mt-1">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplianceDashboard;
