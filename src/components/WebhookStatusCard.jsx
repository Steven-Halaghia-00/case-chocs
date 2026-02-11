
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function WebhookStatusCard() {
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
    lastActivity: null,
    recentErrors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch counts
        const { count: totalCount } = await supabase.from('webhook_logs').select('*', { count: 'exact', head: true });
        const { count: successCount } = await supabase.from('webhook_logs').select('*', { count: 'exact', head: true }).eq('status', 'success');
        const { count: errorCount } = await supabase.from('webhook_logs').select('*', { count: 'exact', head: true }).eq('status', 'error');
        
        // Fetch last activity
        const { data: lastLog } = await supabase
          .from('webhook_logs')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        // Fetch recent errors
        const { data: recentErrors } = await supabase
          .from('webhook_logs')
          .select('created_at, error_message')
          .eq('status', 'error')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          total: totalCount || 0,
          success: successCount || 0,
          error: errorCount || 0,
          lastActivity: lastLog?.created_at || null,
          recentErrors: recentErrors || []
        });
      } catch (error) {
        console.error("Error fetching webhook stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Subscribe to realtime updates
    const subscription = supabase
      .channel('webhook_stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webhook_logs' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return <Skeleton className="w-full h-48" />;
  }

  return (
    <Card className="shadow-sm border-gray-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
          <Activity className="h-4 w-4" />
          État du système Webhook
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="space-y-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            <p className="text-xs text-muted-foreground">Total Reçus</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-2xl font-bold text-emerald-600">{stats.success}</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" /> Succès
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-2xl font-bold text-red-600">{stats.error}</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-500" /> Erreurs
            </p>
          </div>

          <div className="space-y-1 border-l pl-4 md:border-l-gray-100 dark:md:border-l-slate-800">
             <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4 text-indigo-500" />
                Dernière activité
             </div>
             <p className="text-xs text-muted-foreground">
               {stats.lastActivity 
                 ? format(new Date(stats.lastActivity), 'dd/MM/yyyy HH:mm:ss') 
                 : 'Aucune activité'}
             </p>
          </div>

        </div>

        {stats.recentErrors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-red-600 mb-2">Dernières erreurs :</p>
            <ul className="space-y-1">
              {stats.recentErrors.map((err, idx) => (
                <li key={idx} className="text-[10px] text-gray-500 flex gap-2">
                  <span className="text-gray-400 whitespace-nowrap">{format(new Date(err.created_at), 'HH:mm')}</span>
                  <span className="truncate">{err.error_message || 'Erreur inconnue'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
