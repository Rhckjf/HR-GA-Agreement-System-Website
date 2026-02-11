import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AgreementsList from "@/pages/AgreementsList";
import AgreementForm from "@/pages/AgreementForm";
import AgreementDetail from "@/pages/AgreementDetail";
import VendorsList from "@/pages/VendorsList";
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

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
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
      <Toaster position="top-right" />
    </div>
  );
}

export default App;