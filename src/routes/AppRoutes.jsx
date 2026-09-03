import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Home from "../pages/Home";
import FindJobs from "../pages/FindJobs";
import JobDetail from "../pages/JobDetail";
import CompanyDetail from "../pages/CompanyDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import CandidateDashboard from "../pages/CandidateDashboard";
import CandidateProfile from "../pages/CandidateProfile";
import SavedJobs from "../pages/SavedJobs";
import Interviews from "../pages/Interviews";
import ResumeCV from "../pages/ResumeCV";
import Notifications from "../pages/Notifications";
import Settings from "../pages/Settings";
import Admin from "../pages/Admin";
import MyApplications from "../pages/MyApplications";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import HRRoute from "./HRRoute";
import Interview from "../pages/Interview";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminManageUsers from "../pages/admin/AdminManageUsers";
import AdminManageJobs from "../pages/admin/AdminManageJobs";
import AdminApproveJobs from "../pages/admin/AdminApproveJobs";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminApplications from "../pages/admin/AdminApplications";
import AdminHRManagement from "../pages/admin/AdminHRManagement";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminSettings from "../pages/admin/AdminSettings";
import HRDashboard from "../pages/hr/HRDashboard";
import HRPostJob from "../pages/hr/HRPostJob";
import HRMyJobs from "../pages/hr/HRMyJobs";
import HRApplicants from "../pages/hr/HRApplicants";
import HRInterviews from "../pages/hr/HRInterviews";
import HRCompanyProfile from "../pages/hr/HRCompanyProfile";
import HRNotifications from "../pages/hr/HRNotifications";
import HRSettings from "../pages/hr/HRSettings";

// Everyone sees home page - logged in or not
function RootRedirect() {
  return <Home />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/find-jobs" element={<FindJobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/companies/:name" element={<CompanyDetail />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <CandidateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/saved-jobs"
          element={
            <ProtectedRoute>
              <SavedJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/interviews"
          element={
            <ProtectedRoute>
              <Interviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/resume"
          element={
            <ProtectedRoute>
              <ResumeCV />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute admin><AdminManageUsers /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute admin><AdminManageJobs /></ProtectedRoute>} />
        <Route path="/admin/approve-jobs" element={<ProtectedRoute admin><AdminApproveJobs /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute admin><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/applications" element={<ProtectedRoute admin><AdminApplications /></ProtectedRoute>} />
        <Route path="/admin/hr-management" element={<ProtectedRoute admin><AdminHRManagement /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute admin><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute admin><AdminSettings /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<Interview />} />

        {/* HR routes */}
        <Route path="/hr/dashboard" element={<HRRoute><HRDashboard /></HRRoute>} />
        <Route path="/hr/post-job" element={<HRRoute><HRPostJob /></HRRoute>} />
        <Route path="/hr/jobs" element={<HRRoute><HRMyJobs /></HRRoute>} />
        <Route path="/hr/applicants" element={<HRRoute><HRApplicants /></HRRoute>} />
        <Route path="/hr/interviews" element={<HRRoute><HRInterviews /></HRRoute>} />
        <Route path="/hr/company" element={<HRRoute><HRCompanyProfile /></HRRoute>} />
        <Route path="/hr/notifications" element={<HRRoute><HRNotifications /></HRRoute>} />
        <Route path="/hr/settings" element={<HRRoute><HRSettings /></HRRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}