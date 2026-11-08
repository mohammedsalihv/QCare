import { Link, useLocation } from 'react-router-dom';
import { History } from 'lucide-react';
import modules from '../../../server/utils/auditModules.json';
export default function ModuleAuditLink() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/dashboard\//, '');
  const module = modules.find(item => item.pages.some(page => slug === page || slug.startsWith(page + '/')));
  const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase();
  if (!module || !(['admin', 'superadmin'].includes(role) || (role === 'qualitymanager' && !module.adminOnly))) return null;
  return <div className="qc-module-audit-link"><Link to={'/dashboard/module-audit/' + module.key}><History size={16}/>{module.label} audit log</Link></div>;
}
