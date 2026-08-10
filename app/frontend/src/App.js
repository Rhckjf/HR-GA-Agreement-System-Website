import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import DepartmentDashboard from "@/pages/DepartmentDashboard";
import DepartmentSettings from "@/pages/DepartmentSettings";
import UserManagement from "@/pages/UserManagement";
import AgreementsList from "@/pages/AgreementsList";
import AgreementForm from "@/pages/AgreementForm";
import AgreementDetail from "@/pages/AgreementDetail";
import VendorsList from "@/pages/VendorsList";
import AuditLogs from "@/pages/AuditLogs";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const HomeRedirect = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.department) {
      return <Navigate to={`/department/${user.department}`} replace />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/" element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute>
              <Layout>
                <DepartmentSettings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/department/:dept" element={
            <ProtectedRoute>
              <Layout>
                <DepartmentDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/agreements" element={
            <ProtectedRoute>
              <Layout>
                <AgreementsList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/agreements/new" element={
            <ProtectedRoute>
              <Layout>
                <AgreementForm />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/agreements/edit/:id" element={
            <ProtectedRoute>
              <Layout>
                <AgreementForm />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/agreements/:id" element={
            <ProtectedRoute>
              <Layout>
                <AgreementDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/vendors" element={
            <ProtectedRoute>
              <Layout>
                <VendorsList />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;