import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Import pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import DoctorsPage from "./pages/DoctorsPage";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import ProfilePage from "./pages/ProfilePage";
import AppointmentManagementPage from "./pages/AppointmentManagementPage";
import DoctorAppointmentsPage from "./pages/DoctorAppointmentsPage";
import DoctorAppointmentHistoryPage from "./pages/DoctorAppointmentHistoryPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import DoctorPendingRequestsPage from "./pages/DoctorPendingRequestsPage";
import AdminPage from "./pages/AdminPage";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import StartCall from "./pages/StartCall";
import UploadReportPage from "./pages/UploadReportPage";
import AppointmentHistoryPage from "./pages/AppointmentHistoryPage";
import AppointmentStatusPage from "./pages/AppointmentStatusPage";
import PharmacyPage from "./pages/PharmacyPage";
import NotFound from "./pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/auth/*" element={<AuthPage />} />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>

        {/* Dashboard routes with sidebar */}
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route path="patient" element={<PatientDashboard />} />
          <Route path="doctor" element={<DoctorDashboard />} />
        </Route>

        {/* Other authenticated routes with sidebar */}
        <Route path="/appointments" element={<DashboardLayout />}>
          <Route index element={<AppointmentManagementPage />} />
        </Route>
        <Route path="/doctor/appointments" element={<DashboardLayout />}>
          <Route index element={<DoctorAppointmentsPage />} />
        </Route>
        <Route path="/doctor/appointment-history" element={<DashboardLayout />}>
          <Route index element={<DoctorAppointmentHistoryPage />} />
        </Route>
        <Route path="/prescriptions" element={<DashboardLayout />}>
          <Route index element={<PrescriptionsPage />} />
        </Route>
        <Route path="/notifications" element={<DashboardLayout />}>
          <Route index element={<NotificationsPage />} />
        </Route>
        <Route path="/pending-requests" element={<DashboardLayout />}>
          <Route index element={<DoctorPendingRequestsPage />} />
        </Route>
        <Route path="/profile" element={<DashboardLayout />}>
          <Route index element={<ProfilePage />} />
        </Route>
        <Route path="/doctors" element={<DashboardLayout />}>
          <Route index element={<DoctorsPage />} />
        </Route>
        <Route path="/doctors/:id" element={<DashboardLayout />}>
          <Route index element={<DoctorProfilePage />} />
        </Route>
        <Route path="/book-appointment/:id" element={<DashboardLayout />}>
          <Route index element={<BookAppointmentPage />} />
        </Route>
        <Route path="/chat" element={<DashboardLayout />}>
          <Route index element={<ChatPage />} />
        </Route>
        <Route path="/upload-report" element={<DashboardLayout />}>
          <Route index element={<UploadReportPage />} />
        </Route>
        <Route path="/appointment-history" element={<DashboardLayout />}>
          <Route index element={<AppointmentHistoryPage />} />
        </Route>
        <Route path="/appointment-status" element={<DashboardLayout />}>
          <Route index element={<AppointmentStatusPage />} />
        </Route>
        <Route path="/pharmacy" element={<DashboardLayout />}>
          <Route index element={<PharmacyPage />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminPage />} />
        </Route>
        <Route path="/start-call" element={<DashboardLayout />}>
          <Route index element={<StartCall />} />
        </Route>

      </Route>{/* end ProtectedRoute */}

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
