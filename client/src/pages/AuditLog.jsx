import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ModuleAuditLog from '../components/ModuleAuditLog';
export default function AuditLog() {
  const { module } = useParams();
  return <DashboardLayout><ModuleAuditLog moduleKey={module}/></DashboardLayout>;
}
