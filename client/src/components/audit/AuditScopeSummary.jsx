import React from 'react';
import { MapPin } from 'lucide-react';
export default function AuditScopeSummary({ audit, showPeople = true }) {
  const departments = audit.concernedDepartments?.map(d => d.name).filter(Boolean).join(', ') || audit.department;
  const persons = audit.concernedPersons?.map(p => p.employeeName).filter(Boolean).join(', ');
  return <div className="text-sm space-y-1"><p className="flex items-center gap-1 font-medium"><MapPin size={14} className="shrink-0" />{audit.location?.name || 'Location not specified'}</p><p className="text-slate-600">Departments: {departments || 'Not selected'}</p>{showPeople && <p className="text-slate-600">Concerned persons: {persons || 'Not selected'}</p>}</div>;
}
