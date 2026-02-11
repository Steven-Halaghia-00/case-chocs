
import React from 'react';
import WebhookLogsSection from '@/components/admin/WebhookLogsSection';

export default function AdminLogsPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs Webhooks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Historique complet des communications entrantes.</p>
      </div>

      <div className="flex-1 min-h-[500px] bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-100 dark:border-slate-800 p-6">
        <WebhookLogsSection />
      </div>
    </div>
  );
}
