import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentLibrary from "./pages/DocumentLibrary";
import UserManagement from "./pages/UserManagement";
import DepartmentMaster from "./pages/DepartmentMaster";
import JawdaKPI from "./pages/JawdaKPI";
import IncidentManagement from "./pages/IncidentManagement";
import Notifications from "./pages/Notifications";
import SystemSettings from "./pages/SystemSettings";
import HelpDesk from "./pages/HelpDesk";
import UserManuals from "./pages/UserManuals";
import JawdaAOT from "./pages/JawdaAOT";
import JawdaASD from "./pages/JawdaASD";
import JawdaBN from "./pages/JawdaBN";
import JawdaDF from "./pages/JawdaDF";
import ComplianceManagement from "./pages/ComplianceManagement";
import ClinicalAuditCenter from "./pages/ClinicalAuditWorkspace";
import RiskManagementCenter from "./pages/RiskManagementCenter";
import TrainingCompetencyCenter from "./pages/TrainingCompetencyCenter";
import PatientExperienceCenter from "./pages/PatientExperienceCenter";
import IPCManagementCenter from "./pages/IPCManagementCenter";
import MedicationSafetyCenter from "./pages/MedicationSafetyCenter";
import FMSManagementCenter from "./pages/FMSManagementCenter";
import MedicalAffairsCenter from "./pages/MedicalAffairsCenter";
import ChangeManagement from "./pages/ChangeManagement";
import DeviationsNCs from "./pages/DeviationsNCs";
import CapaManagement from "./pages/CapaManagement";
import SupplierManagement from "./pages/SupplierManagement";
import EquipmentManagement from "./pages/EquipmentManagement";
import ContactInformationMaster from "./pages/ContactInformationMaster";
import LocationTypes from "./pages/LocationTypes";
import SpecialityMaster from "./pages/SpecialityMaster";
import DesignationMaster from "./pages/DesignationMaster";
import MallCredential from "./pages/MallCredential";
import PhysicianDemography from "./pages/PhysicianDemography";
import PhysicianDemographyVerification from "./pages/PhysicianDemographyVerification";
import ApplicationRoles from "./pages/ApplicationRoles";
import UserAssignment from "./pages/UserAssignment";
import PasswordManagement from "./pages/PasswordManagement";
import AuditLog from "./pages/AuditLog";
import MailLog from "./pages/MailLog";
import ReportGenerator from "./pages/ReportGenerator";
import ClinicalPrivileges from "./pages/ClinicalPrivileges";
import KeyPerformanceIndicator from "./pages/KeyPerformanceIndicator";
import IndicatorWorkspace from "./pages/IndicatorWorkspace";
import OoppeManagement from "./pages/OoppeManagement";
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  ChevronDown,
  Monitor,
  Settings,
  LogOut,
  Shield,
  HelpCircle,
  AlertTriangle,
  X,
  ThumbsUp,
  BookOpen,
  ShieldAlert,
  Building2,
  MapPin,
  Phone,
  Users,
  Briefcase,
  Award,
  Stethoscope,
  UserSquare2,
  FileCheck,
  Library,
  GraduationCap,
  AlertCircle,
  ClipboardList,
  ShieldCheck,
  Wrench,
  Heart,
  Lock,
  UserCheck,
  KeyRound,
  Database,
  ChevronRight,
  ChevronUp,
  BarChart2,
  MailSearch
} from 'lucide-react';
function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/dashboard/documents" element={<DocumentLibrary/>} />
          <Route path="/dashboard/users" element={<UserManagement/>} />
          <Route path="/dashboard/departments" element={<DepartmentMaster/>} />
          <Route path="/dashboard/kpi" element={<IndicatorWorkspace/>} />
          <Route path="/dashboard/incidents" element={<IncidentManagement/>} />
          <Route path="/notifications" element={<Notifications/>} />
          <Route path="/dashboard/settings" element={<SystemSettings/>} />
          <Route path="/dashboard/support" element={<HelpDesk/>} />
          <Route path="/dashboard/manuals" element={<UserManuals/>} />
          <Route path="/dashboard/jawda/aot" element={<JawdaAOT/>} />
          <Route path="/dashboard/jawda/asd" element={<JawdaASD/>} />
          <Route path="/dashboard/jawda/bn" element={<JawdaBN/>} />
          <Route path="/dashboard/jawda/df" element={<JawdaDF/>} />
          <Route path="/dashboard/compliance" element={<ComplianceManagement/>} />
          <Route path="/dashboard/audit" element={<ClinicalAuditCenter/>} />
          <Route path="/dashboard/risks" element={<RiskManagementCenter/>} />
          <Route path="/dashboard/training" element={<TrainingCompetencyCenter/>} />
          <Route path="/dashboard/experience" element={<PatientExperienceCenter/>} />
          <Route path="/dashboard/complaints" element={<PatientExperienceCenter/>} />
          <Route path="/dashboard/change-management" element={<ChangeManagement/>} />
          <Route path="/dashboard/deviations" element={<DeviationsNCs/>} />
          <Route path="/dashboard/capa" element={<CapaManagement/>} />
          <Route path="/dashboard/supplier" element={<SupplierManagement/>} />
          <Route path="/dashboard/equipment" element={<EquipmentManagement/>} />
          <Route path="/dashboard/ipc" element={<IPCManagementCenter/>} />
          <Route path="/dashboard/meds" element={<MedicationSafetyCenter/>} />
          <Route path="/dashboard/fms" element={<FMSManagementCenter/>} />
          <Route path="/dashboard/cp" element={<MedicalAffairsCenter/>} />
          <Route path="/dashboard/contact-master" element={<ContactInformationMaster/>} />
          <Route path="/dashboard/location-types" element={<LocationTypes/>} />
          <Route path="/dashboard/speciality-master" element={<SpecialityMaster/>} />
          <Route path="/dashboard/designation-master" element={<DesignationMaster/>} />
          <Route path="/dashboard/mall-credential" element={<MallCredential/>} />
          <Route path="/dashboard/physician-demography" element={<PhysicianDemography/>} />
          <Route path="/dashboard/physician-demography-verification" element={<PhysicianDemographyVerification/>} />
          <Route path="/dashboard/application-roles" element={<ApplicationRoles/>} />
          <Route path="/dashboard/user-assignment" element={<UserAssignment/>} />
          <Route path="/dashboard/password-management" element={<PasswordManagement/>} />
          <Route path="/dashboard/audit-log" element={<AuditLog/>} />
          <Route path="/dashboard/mail-log" element={<MailLog/>} />
          <Route path="/dashboard/report-generator" element={<ReportGenerator/>} />
          <Route path="/dashboard/clinical-privileges" element={<ClinicalPrivileges/>} />
          <Route path="/dashboard/key-performance-indicator" element={<IndicatorWorkspace/>} />
          <Route path="/dashboard/indicator-settings" element={<KeyPerformanceIndicator/>} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
