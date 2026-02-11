
import React, { useState, useEffect } from 'react';
import TicketsTrackerSelector from '@/components/Dashboard/TicketsTrackerSelector.jsx';
import TicketsTrackerChart from './TicketsTrackerChart';
import { calculateRelativeDayData, mergeEventDataForChart } from '@/lib/ticketsTrackerDataService';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TicketsTrackerSection() {
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventNames, setEventNames] = useState({});

  // When selection changes, fetch details and recalculate chart
  const handleEventsSelected = async (newSelectedIds) => {
    setSelectedEventIds(newSelectedIds);

    if (newSelectedIds.length === 0) {
      setChartData([]);
      setEventNames({});
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch details for selected events (names for the legend)
      const { data: eventsData, error } = await supabase
        .from('petzi_events')
        .select('id, name')
        .in('id', newSelectedIds);

      if (error) throw error;

      // Update name map
      const nameMap = {};
      eventsData.forEach(e => {
        nameMap[e.id] = e.name;
      });
      setEventNames(nameMap);

      // 2. Calculate individual event curves
      const rawData = await calculateRelativeDayData(newSelectedIds);
      
      // 3. Merge into single dataset for Recharts
      const merged = mergeEventDataForChart(rawData, newSelectedIds);
      
      setChartData(merged);
    } catch (error) {
      console.error("Error updating tracker chart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Tickets Tracker</h2>
        <p className="text-muted-foreground">
          Comparez les courbes de vente par rapport à la date de l'événement (J0).
          Idéal pour voir si un événement est en avance ou en retard par rapport aux éditions précédentes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Selector Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <TicketsTrackerSelector 
            selectedEvents={selectedEventIds}
            onSelectEvents={handleEventsSelected}
          />
        </div>

        {/* Chart Section */}
        <Card className="h-[550px] flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-slate-900/50 pb-4">
            <CardTitle>Courbes de Vente Comparatives</CardTitle>
            <CardDescription>
              {selectedEventIds.length > 0 
                ? `Comparaison de ${selectedEventIds.length} événement(s)`
                : "Sélectionnez des événements pour commencer"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 z-10 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">Calcul des tendances...</p>
                </div>
              </div>
            )}
            
            <TicketsTrackerChart 
              data={chartData} 
              selectedEvents={selectedEventIds} 
              eventNames={eventNames} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
