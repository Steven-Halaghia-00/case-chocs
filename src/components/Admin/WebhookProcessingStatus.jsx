
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

export default function WebhookProcessingStatus() {
  const [status, setStatus] = useState({
    lastWebhook: null,
    stats: {
      totalWebhooks: 0,
      totalSessions: 0,
      totalTickets: 0
    },
    loading: true,
    error: null
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // 1. Get last webhook log - Use limit(1) instead of single() to avoid 406 error on empty table
      const { data: logsData, error: logError } = await supabase
        .from('petzi_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logError && logError.code !== 'PGRST116') throw logError;

      const lastLog = logsData && logsData.length > 0 ? logsData[0] : null;

      // 2. Get counts
      const { count: webhookCount, error: countError1 } = await supabase.from('petzi_webhook_logs').select('*', { count: 'exact', head: true });
      if (countError1) throw countError1;

      const { count: sessionCount, error: countError2 } = await supabase.from('petzi_sessions').select('*', { count: 'exact', head: true });
      if (countError2) throw countError2;

      const { count: ticketCount, error: countError3 } = await supabase.from('petzi_tickets').select('*', { count: 'exact', head: true });
      if (countError3) throw countError3;

      setStatus({
        lastWebhook: lastLog || null,
        stats: {
          totalWebhooks: webhookCount || 0,
          totalSessions: sessionCount || 0,
          totalTickets: ticketCount || 0
        },
        loading: false,
        error: null
      });

    } catch (err) {
      console.error("Status fetch error:", err);
      setStatus(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (webhookStatus) => {
    if (!webhookStatus) return 'bg-gray-100 text-gray-500';
    switch (webhookStatus) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (webhookStatus) => {
    switch (webhookStatus) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-indigo-500 shadow-sm mb-6 bg-white rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            État du Système Webhook
          </CardTitle>
          {status.lastWebhook && (
             <Badge className={getStatusColor(status.lastWebhook.status)}>
                {status.lastWebhook.status?.toUpperCase() || 'UNKNOWN'}
             </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Last Webhook Info */}
           <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border">
              <p className="text-xs font-medium text-gray-500 uppercase">Dernier Webhook</p>
              <div className="flex items-center gap-2 mt-1">
                 {getStatusIcon(status.lastWebhook?.status)}
                 <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate">
                       {status.lastWebhook 
                         ? formatDistanceToNow(new Date(status.lastWebhook.created_at), { addSuffix: true, locale: fr })
                         : 'Aucun webhook'}
                    </span>
                    {status.lastWebhook?.status === 'error' && (
                        <span className="text-xs text-red-500 truncate max-w-[150px]" title={status.lastWebhook.error_message}>
                           {status.lastWebhook.error_message}
                        </span>
                    )}
                 </div>
              </div>
           </div>

           {/* Metrics */}
           <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border flex flex-col justify-center">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Reçus</p>
              <div className="text-2xl font-bold text-indigo-600">{status.stats.totalWebhooks}</div>
           </div>
           
           <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border flex flex-col justify-center">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Sessions Créées</p>
              <div className="text-2xl font-bold text-emerald-600">{status.stats.totalSessions}</div>
           </div>

           <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border flex flex-col justify-center">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Billets Créés</p>
              <div className="text-2xl font-bold text-blue-600">{status.stats.totalTickets}</div>
           </div>
        </div>
        
        <div className="mt-4 flex justify-end">
           <Button variant="ghost" size="sm" className="text-xs text-gray-500" onClick={fetchData}>
              Actualiser maintenant
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
