
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardSection() {
  const [stats, setStats] = useState({
    totalWebhooks: 0,
    pending: 0,
    success: 0,
    error: 0,
    totalEvents: 0,
    totalSessions: 0,
    totalTickets: 0,
    lastWebhook: null,
    lastError: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Parallel fetching for performance
        const results = await Promise.all([
          supabase.from('petzi_webhook_logs').select('status', { count: 'exact' }),
          supabase.from('petzi_events').select('*', { count: 'exact', head: true }),
          supabase.from('petzi_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('petzi_tickets').select('*', { count: 'exact', head: true }),
          supabase.from('petzi_webhook_logs').select('created_at').order('created_at', { ascending: false }).limit(1),
          supabase.from('petzi_webhook_logs').select('created_at').eq('status', 'error').order('created_at', { ascending: false }).limit(1)
        ]);

        const [webhooksData, eventsData, sessionsData, ticketsData, lastWebhookData, lastErrorData] = results;

        if (webhooksData.error) throw webhooksData.error;

        // Calculate status breakdown locally from the first query results
        // Use default empty object if no data
        const rows = webhooksData.data || [];
        const statusCounts = rows.reduce((acc, curr) => {
            const s = curr.status || 'unknown';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        setStats({
          totalWebhooks: webhooksData.count || 0,
          pending: statusCounts.pending || 0,
          success: statusCounts.success || 0,
          error: statusCounts.error || 0,
          totalEvents: eventsData.count || 0,
          totalSessions: sessionsData.count || 0,
          totalTickets: ticketsData.count || 0,
          lastWebhook: (lastWebhookData.data && lastWebhookData.data.length > 0) ? lastWebhookData.data[0].created_at : null,
          lastError: (lastErrorData.data && lastErrorData.data.length > 0) ? lastErrorData.data[0].created_at : null
        });

      } catch (err) {
        console.error("Admin Dashboard Fetch Error:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  
  if (error) return (
    <div className="p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
      <AlertCircle className="h-5 w-5" />
      {error}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWebhooks}</div>
            <p className="text-xs text-muted-foreground">Reçus depuis le début</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Succès / Erreurs</CardTitle>
            <div className="flex gap-1">
               <CheckCircle className="h-4 w-4 text-green-500" />
               <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex gap-2">
                <span className="text-green-600">{stats.success}</span>
                <span className="text-gray-300">/</span>
                <span className="text-red-600">{stats.error}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stats.pending} en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Activité</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
                {stats.lastWebhook ? new Date(stats.lastWebhook).toLocaleString() : 'Jamais'}
            </div>
            <p className="text-xs text-muted-foreground">
               Dernière erreur: {stats.lastError ? new Date(stats.lastError).toLocaleTimeString() : 'Aucune'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Données</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Tickets répartis sur {stats.totalEvents} événements
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
