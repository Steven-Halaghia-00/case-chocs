
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { Database, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

/**
 * Displays stats about the current Petzi tables to verify data integrity.
 * Simplified to remove references to legacy 'events' and 'tickets' tables.
 */
function DataVerificationPanel() {
  const [stats, setStats] = useState({
    events: 0,
    sessions: 0,
    tickets: 0,
    logs: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { count: eventsCount } = await supabase.from('petzi_events').select('*', { count: 'exact', head: true });
      const { count: sessionsCount } = await supabase.from('petzi_sessions').select('*', { count: 'exact', head: true });
      const { count: ticketsCount } = await supabase.from('petzi_tickets').select('*', { count: 'exact', head: true });
      const { count: logsCount } = await supabase.from('petzi_webhook_calls').select('*', { count: 'exact', head: true });

      setStats({
        events: eventsCount || 0,
        sessions: sessionsCount || 0,
        tickets: ticketsCount || 0,
        logs: logsCount || 0
      });
    } catch (e) {
      console.error("Error verifying data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to changes in petzi_tickets to update counts in real-time
    const channel = supabase.channel('stats_monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_tickets' }, fetchData)
        .subscribe();
        
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <Card className="border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-900/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Database className="h-5 w-5" />
                <CardTitle className="text-base">État Base de Données</CardTitle>
            </div>
            <button onClick={fetchData} className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Événements" value={stats.events} loading={loading} />
            <StatItem label="Sessions" value={stats.sessions} loading={loading} />
            <StatItem label="Billets" value={stats.tickets} loading={loading} />
            <StatItem label="Webhooks" value={stats.logs} loading={loading} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value, loading }) {
    return (
        <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                {loading ? '-' : value}
            </p>
        </div>
    );
}

export default DataVerificationPanel;
