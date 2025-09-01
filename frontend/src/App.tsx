import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/solid';

import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Spinner from './components/common/Spinner';
import Notification from './components/common/Notification';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/reports/ReportPage';
import AdminPage from './pages/admin/AdminPage';
import SettingsPage from './pages/settings/SettingsPage';
import AreaAssignmentsPage from './pages/assignments/AreaAssignmentsPage';
import StationAssignmentsPage from './pages/assignments/StationAssignmentsPage';
import SessionManagementPage from './pages/admin/SessionManagementPage';
import WebViewer from './pages/webViewer/WebViewPage';
import WebViewLinkManager from './pages/webViewer/controller/WebViewLinkManager';
import { StationInfoAdminPage } from './pages/stationInfo/StationInfoAdminPage';
import ApiKeyManagementPage from './pages/keyApi/ApiKeyManagementPage';

/* ---------------- Access Denied ---------------- */
const AccessDenied: React.FC = () => (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl text-center">
        <LockClosedIcon className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You don't have permission to view this page.
        </p>
      </div>
    </MainLayout>
);

/* ---------------- Protected Route ---------------- */
interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string | string[];
  adminBypass?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                         children,
                                                         permissions = [],
                                                         adminBypass = true,
                                                       }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
        <div className="w-screen h-screen flex justify-center items-center">
          <Spinner size="lg" />
        </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  const requiredPermissions = Array.isArray(permissions)
      ? permissions
      : [permissions];

  if (!(adminBypass && currentUser.role?.name === 'admin')) {
    const userPermissions = new Set(
        currentUser.role?.permissions?.map((p) => p.name) || []
    );

    const hasPermission = requiredPermissions.some(
        (perm) => perm === 'all' || userPermissions.has(perm)
    );

    if (!hasPermission) return <AccessDenied />;
  }

  return <MainLayout>{children}</MainLayout>;
};

/* ---------------- Routes ---------------- */
const routeConfig = [
  { path: '/login', element: <LoginPage />, public: true },
  { path: '/dashboard', element: <DashboardPage />, permissions: 'view_dashboard' },
  { path: '/reports/:reportType', element: <ReportPage />, permissions: 'view_reports' },
  { path: '/admin/*', element: <AdminPage />, permissions: 'access_admin' },
  { path: '/settings', element: <SettingsPage />, permissions: 'edit_settings' },
  { path: '/assignments/areas', element: <AreaAssignmentsPage />, permissions: 'assign_areas' },
  { path: '/assignments/stations', element: <StationAssignmentsPage />, permissions: 'assign_stations' },
  { path: '/sessions', element: <SessionManagementPage />, permissions: 'manage_sessions' },
  { path: '/webviewer', element: <WebViewer />, permissions: 'web_viewer' },
  { path: '/webviewer/admin', element: <WebViewLinkManager />, permissions: 'web_viewer' },
  { path: '/station_info', element: <StationInfoAdminPage />, permissions: 'station_info' },
  { path: '/api_key', element: <ApiKeyManagementPage />, permissions: 'key_api' },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
];

/* ---------------- App ---------------- */
const App: React.FC = () => (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {routeConfig.map((route) =>
                route.public ? (
                    <Route key={route.path} path={route.path} element={route.element} />
                ) : (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <ProtectedRoute permissions={route.permissions} adminBypass>
                            {route.element}
                          </ProtectedRoute>
                        }
                    />
                )
            )}
          </Routes>
          <Notification />
        </div>
      </Router>
    </AuthProvider>
);

export default App;
