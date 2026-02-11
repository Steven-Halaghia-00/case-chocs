
import React from 'react';
import WebhookDebugPanel from '@/components/admin/WebhookDebugPanel';

export default function AdminDebugPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outils de Débogage</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Inspection et rejeu des webhooks pour diagnostic.</p>
      </div>

      <div className="flex-1 min-h-[600px] bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-100 dark:border-slate-800 p-6 overflow-hidden">
        <WebhookDebugPanel />
      </div>
    </div>
  );
}
