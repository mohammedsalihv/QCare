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
import ClinicalAuditCenter from "./pages/ClinicalAuditCenter";
import RiskManagementCenter from "./pages/RiskManagementCenter";
import TrainingCompetencyCenter from "./pages/TrainingCompetencyCenter";
import PatientExperienceCenter from "./pages/PatientExperienceCenter";
import IPCManagementCenter from "./pages/IPCManagementCenter";
import MedicationSafetyCenter from "./pages/MedicationSafetyCenter";
import FMSManagementCenter from "./pages/FMSManagementCenter";
import MedicalAffairsCenter from "./pages/MedicalAffairsCenter";

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
          <Route path="/dashboard/kpi" element={<JawdaKPI/>} />
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
          <Route path="/dashboard/ipc" element={<IPCManagementCenter/>} />
          <Route path="/dashboard/meds" element={<MedicationSafetyCenter/>} />
          <Route path="/dashboard/fms" element={<FMSManagementCenter/>} />
          <Route path="/dashboard/cp" element={<MedicalAffairsCenter/>} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;