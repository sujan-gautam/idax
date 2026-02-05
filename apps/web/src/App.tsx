import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { AdminLayout } from './components/layout/AdminLayout';
import LoadingState from './components/common/LoadingState';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Datasets = lazy(() => import('./pages/Datasets'));
const Jobs = lazy(() => import('./pages/Jobs'));
const DatasetDetails = lazy(() => import('./pages/DatasetDetails'));
const Developer = lazy(() => import('./pages/Developer'));
const Admin = lazy(() => import('./pages/Admin'));
const Billing = lazy(() => import('./pages/Billing'));
const Settings = lazy(() => import('./pages/Settings'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Features = lazy(() => import('./pages/Features'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Legal').then(module => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Legal').then(module => ({ default: module.Terms })));

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState variant="page" message="Loading..." />}>
      <Routes>
        {/* Public Landing & Marketing */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Public Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected User Dashboard routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="datasets/:id" element={<DatasetDetails />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="developer" element={<Developer />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Protected Admin Panel routes - Separate Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="admin" element={<Navigate to="/admin/statistics" replace />} />
          <Route path="admin/statistics" element={<Admin section="statistics" />} />
          <Route path="admin/users" element={<Admin section="users" />} />
          <Route path="admin/features" element={<Admin section="features" />} />
          <Route path="admin/quotas" element={<Admin section="quotas" />} />
          <Route path="admin/audit" element={<Admin section="audit" />} />
          <Route path="admin/settings" element={<Admin section="settings" />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
