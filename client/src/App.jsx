import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentLibrary from "./pages/DocumentLibrary";
import UserManagement from "./pages/UserManagement";
import DepartmentMaster from "./pages/DepartmentMaster";
import KPIMonitor from "./pages/KPIMonitor";
import IncidentManagement from "./pages/IncidentManagement";
import Notifications from "./pages/Notifications";

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
          <Route path="/dashboard/kpi" element={<KPIMonitor/>} />
          <Route path="/dashboard/incidents" element={<IncidentManagement/>} />
          <Route path="/notifications" element={<Notifications/>} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;