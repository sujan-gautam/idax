import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoadingState from './components/common/LoadingState';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const DatasetDetails = lazy(() => import('./pages/DatasetDetails'));
const Admin = lazy(() => import('./pages/Admin'));

// Placeholder pages for those not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-4">
    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="text-slate-500">This feature is currently under development.</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState variant="page" message="Loading..." />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="datasets" element={<PlaceholderPage title="Datasets Library" />} />
          <Route path="datasets/:id" element={<DatasetDetails />} />
          <Route path="jobs" element={<PlaceholderPage title="Jobs & Pipelines" />} />
          <Route path="admin" element={<Admin />} />
          <Route path="billing" element={<PlaceholderPage title="Billing & Subscription" />} />
          <Route path="settings" element={<PlaceholderPage title="Account Settings" />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
