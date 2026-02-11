
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import TicketsPage from '@/pages/TicketsPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import WebhookLogsPage from '@/pages/WebhookLogsPage';
import CapacityManagementPage from '@/pages/CapacityManagementPage';
import AdminPage from '@/pages/AdminPage';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <DarkModeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Routes */}
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Task 9: Ensure specific route for logs exists if accessed directly or via sidebar */}
                <Route
                  path="/admin/logs"
                  element={
                    <ProtectedRoute>
                      <WebhookLogsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Legacy/Direct routes */}
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/:ticket_id"
                  element={
                    <ProtectedRoute>
                      <TicketDetailPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/webhook-logs"
                  element={
                    <ProtectedRoute>
                      <WebhookLogsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/capacity-management"
                  element={
                    <ProtectedRoute>
                      <CapacityManagementPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
            <Toaster />
          </BrowserRouter>
        </DarkModeProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
