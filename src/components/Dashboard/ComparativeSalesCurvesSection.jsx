
import React, { useState, useEffect } from 'react';
import UnifiedEventSelector from '@/components/Dashboard/UnifiedEventSelector';
import TicketsTrackerChart from '@/components/Dashboard/TicketsTrackerChart';
import EventStatisticsGrid from '@/components/Dashboard/EventStatisticsGrid';
import { calculateRelativeDayData, mergeEventDataForChart } from '@/lib/ticketsTrackerDataService';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

export default function ComparativeSalesCurvesSection() {
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventNames, setEventNames] = useState({});
  const [fullEventObjects, setFullEventObjects] = useState([]);

  // When selection changes, fetch details and recalculate chart
  const handleEventsSelected = async (newSelectedIds) => {
    setSelectedEventIds(newSelectedIds);

    if (newSelectedIds.length === 0) {
      setChartData([]);
      setFullEventObjects([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch details for selected events (names for the legend and grid)
      const { data: eventsData, error } = await supabase
        .from('petzi_events')
        .select('id, name')
        .in('id', newSelectedIds);

      if (error) throw error;

      // Update name map and full objects list
      setFullEventObjects(eventsData || []);
      
      const nameMap = {};
      eventsData?.forEach(e => nameMap[e.id] = e.name);
      setEventNames(prev => ({ ...prev, ...nameMap }));

      // 2. Calculate individual event curves
      const rawData = await calculateRelativeDayData(newSelectedIds);
      
      // 3. Merge into single dataset for Recharts
      const merged = mergeEventDataForChart(rawData, newSelectedIds);
      
      setChartData(merged);
    } catch (error) {
      console.error("Error updating sales curves:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            Analyse et Comparatif
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Comparez les dynamiques de vente entre événements et analysez leurs performances individuelles.
          </p>
        </div>
        
        {/* Selector placed prominently */}
        <div className="w-full xl:w-auto min-w-[350px] z-10">
          <UnifiedEventSelector 
            selectedEvents={selectedEventIds}
            onSelectEvents={handleEventsSelected}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section - Takes 2/3 width on large screens */}
        <div className="xl:col-span-2">
            <Card className="min-h-[500px] flex flex-col border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                <CardHeader className="border-b bg-gray-50/50 dark:bg-slate-900/50 pb-4">
                <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Courbes de Ventes (J-X à J0)
                </CardTitle>
                <CardDescription>
                    {selectedEventIds.length > 0 
                    ? `${selectedEventIds.length} événement(s) affiché(s)`
                    : "Sélectionnez des événements pour comparer"}
                </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 min-h-0 p-6 relative bg-white dark:bg-slate-950">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 z-20 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-sm font-medium text-muted-foreground">Calcul des trajectoires...</p>
                    </div>
                    </div>
                )}
                
                <div className="h-[400px] w-full">
                    <TicketsTrackerChart 
                    data={chartData} 
                    selectedEvents={selectedEventIds} 
                    eventNames={eventNames} 
                    />
                </div>
                </CardContent>
            </Card>
        </div>

        {/* Stats Grid - Takes 1/3 width on large screens, displayed below on smaller */}
        <div className="xl:col-span-1">
            {selectedEventIds.length > 0 ? (
                <EventStatisticsGrid 
                    selectedEventIds={selectedEventIds} 
                    selectedEvents={fullEventObjects} 
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 text-center">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3">
                        <TrendingUp className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Statistiques détaillées</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                        Sélectionnez des événements dans le menu ci-dessus pour voir leurs statistiques détaillées ici.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
