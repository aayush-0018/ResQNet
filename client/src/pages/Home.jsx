import { Routes, Route } from "react-router-dom";
import EmergencySuccess from "../components/EmergencySuccess";
import EmergencySOS from "../components/EmergencySOS";
import MainPage from "./MainPage";
import DeptLogin from "./DeptLogin";
import DeptRegister from "./DeptRegister";
import Emergencies from "../components/Emergencies";
import Dashboard from "../components/Dashboard";
import ContributorDashboard from "../pages/contributor/ContributorDashboard";
import ResourceAllocationForm from "../components/ResourceAllocationForm";
import ResourceAllocationSuccess from "../components/ResourceAllocationSuccess";
import ResourceAllocationLoading from "../components/ResourceAllocationLoading";
import ProtectedRoute from "../utils/ProtectedRoute";

function Home() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<DeptLogin />} />
      <Route path="/register" element={<DeptRegister />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contributor"
        element={
          <ProtectedRoute>
            <ContributorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Public routes (no protection) */}
      <Route path="/form" element={<ResourceAllocationForm />} />
      <Route path="/resource-loading" element={<ResourceAllocationLoading />} />
      <Route path="/resource-success" element={<ResourceAllocationSuccess />} />
      <Route path="/emergency" element={<EmergencySOS userId="user12345" />} />
      <Route path="/success" element={<EmergencySuccess />} />
    </Routes>
  );
}

export default Home;
