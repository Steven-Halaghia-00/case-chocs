
import React from 'react';
import WebhookProcessingStatus from '@/components/admin/WebhookProcessingStatus';
import AdminDashboardSection from '@/components/admin/AdminDashboardSection';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble du système et de l'état des services.</p>
      </div>

      {/* Webhook Status Widget */}
      <WebhookProcessingStatus />

      {/* KPI Stats Grid */}
      <AdminDashboardSection />
    </div>
  );
}
