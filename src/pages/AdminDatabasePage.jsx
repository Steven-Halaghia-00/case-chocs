
import React from 'react';
import DatabaseManagementSection from '@/components/admin/DatabaseManagementSection';

export default function AdminDatabasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion Base de Données</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Maintenance des tables, exports et nettoyage des données.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-100 dark:border-slate-800 p-6">
        <DatabaseManagementSection />
      </div>
    </div>
  );
}
