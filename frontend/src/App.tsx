import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Assuming AuthContext is in src/context/

// Import Layouts and Components
import MainLayout from './components/layout/MainLayout';
import Spinner from './components/common/CalSpin'; // Make sure this path is correct
import { LockClosedIcon } from '@heroicons/react/24/solid';

// Import Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import AreaAssignmentsPage from './pages/AreaAssignmentsPage';
import StationAssignmentsPage from './pages/StationAssignmentsPage';
import SessionManagementPage from './pages/SessionManagementPage'; //

// --- Reusable Access Denied Component ---
const AccessDenied: React.FC = () => {
  return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl text-center">
          <LockClosedIcon className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
          <p className="text-gray-600 mt-2">You do not have the required permission to view this page.</p>
        </div>
      </MainLayout>
  );
};

// --- UPDATED ProtectedRoute Component ---
// This now includes a special check for the 'admin' role.
const ProtectedRoute: React.FC<{ children: React.ReactNode; permission: string }> = ({ children, permission }) => {
  const { currentUser, loading } = useAuth();

  // 1. Show a spinner while checking authentication
  if (loading) {
    return (
        <div className="w-screen h-screen flex justify-center items-center">
          <Spinner size="lg" />
        </div>
    );
  }

  // 2. If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. NEW: If user is an admin, grant access immediately
  if (currentUser.role?.name === 'admin') {
    return <MainLayout>{children}</MainLayout>;
  }

  // 4. For all other roles, check for the specific permission
  const userPermissions = new Set(currentUser.role.permissions.map(p => p.name));
  if (!userPermissions.has(permission)) {
    return <AccessDenied />;
  }

  // 5. If all checks pass, render the page
  return <MainLayout>{children}</MainLayout>;
};


// --- Main App Component ---
const App: React.FC = () => {
  return (
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public route for login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={<ProtectedRoute permission="view_dashboard"><DashboardPage /></ProtectedRoute>}
            />
            <Route
                path="/reports"
                element={<ProtectedRoute permission="daily_report"><ReportPage /></ProtectedRoute>}
            />
            <Route
                path="/admin"
                element={<ProtectedRoute permission="access_admin"><AdminPage /></ProtectedRoute>}
            />
            <Route
                path="/settings"
                element={<ProtectedRoute permission="edit_settings"><SettingsPage /></ProtectedRoute>}
            />
            <Route
                path="/assign"
                element={<ProtectedRoute permission="assign_areas"><AreaAssignmentsPage /></ProtectedRoute>}
            />
            <Route
                path="/StationAssignmentsPage"
                element={<ProtectedRoute permission="assign_stations"><StationAssignmentsPage /></ProtectedRoute>}
            />
            <Route
                path="/sessions"
                element={<ProtectedRoute permission="manage_sessions"><SessionManagementPage /></ProtectedRoute>}
            />

            {/* Default route redirects to the dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
};

export default App;