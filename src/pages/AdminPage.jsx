
import React from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminLogsPage from '@/pages/AdminLogsPage';
import AdminDebugPage from '@/pages/AdminDebugPage';
import AdminTestWebhookPage from '@/pages/AdminTestWebhookPage';
import AdminDatabasePage from '@/pages/AdminDatabasePage';
import AdminSystemPage from '@/pages/AdminSystemPage';
import WebhookLogsPage from '@/pages/WebhookLogsPage';
import WebhookStatusCard from '@/components/WebhookStatusCard';

export default function AdminPage() {
  const location = useLocation();

  // Task 8: Add WebhookLogs section
  const WebhookLogsSection = () => (
      <div className="space-y-6">
          <WebhookStatusCard />
          <WebhookLogsPage />
      </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <Helmet>
        <title>Admin Dashboard - Petzi Billetterie</title>
      </Helmet>

      {/* Sidebar - Fixed Left */}
      <AdminSidebar />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto min-h-full">
            <Routes>
                <Route path="/" element={<AdminDashboardPage />} />
                <Route path="/logs" element={<AdminLogsPage />} />
                <Route path="/webhooks" element={<WebhookLogsSection />} /> {/* New Route */}
                <Route path="/debug" element={<AdminDebugPage />} />
                <Route path="/test-webhook" element={<AdminTestWebhookPage />} />
                <Route path="/database" element={<AdminDatabasePage />} />
                <Route path="/system" element={<AdminSystemPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </div>
      </main>
    </div>
  );
}
