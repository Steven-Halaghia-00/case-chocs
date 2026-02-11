
import React from 'react';
import ApplicationInfoSection from '@/components/admin/ApplicationInfoSection';

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Système & Information</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">État technique de l'application et de l'infrastructure.</p>
      </div>

      <ApplicationInfoSection />
    </div>
  );
}
