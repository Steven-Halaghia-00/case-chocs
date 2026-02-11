
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import GlobalKPIs from '@/components/Dashboard/GlobalKPIs';
import ComparativeSalesCurvesSection from '@/components/Dashboard/ComparativeSalesCurvesSection';
import { getGlobalKPIs } from '@/lib/dashboardService';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function DashboardPage() {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const data = await getGlobalKPIs();
      setGlobalData(data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-slate-950 pb-20">
      <Helmet>
        <title>Tableau de Bord - Petzi</title>
      </Helmet>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Tableau de Bord</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble des ventes et performances de vos événements.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchGlobalData} 
            disabled={loading}
            className="gap-2 bg-white dark:bg-slate-900"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Global Stats - Now 3 columns */}
        <section>
          <GlobalKPIs data={globalData} loading={loading} />
        </section>

        {/* Comparative Sales Section - Including Chart and Event Stats */}
        <section className="pt-2">
          <ComparativeSalesCurvesSection />
        </section>

      </div>
    </div>
  );
}
