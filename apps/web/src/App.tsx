import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import DatasetDetails from './pages/DatasetDetails';
import Admin from './pages/Admin';

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
  );
};

export default App;
