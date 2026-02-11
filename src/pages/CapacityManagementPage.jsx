
import React from 'react';
import { Helmet } from 'react-helmet';
import { BarChart3 } from 'lucide-react';
import CapacityManagement from '@/components/CapacityManagement';

const CapacityManagementPage = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 px-4 md:px-8 pt-6">
      <Helmet>
        <title>Gestion Capacité - Case à Chocs</title>
        <meta name="description" content="Manage event capacities and sessions" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Gestion de la Capacité
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Définissez les jauges pour chaque session et suivez les disponibilités en temps réel.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[600px]">
          <CapacityManagement />
      </div>
    </div>
  );
};

export default CapacityManagementPage;
