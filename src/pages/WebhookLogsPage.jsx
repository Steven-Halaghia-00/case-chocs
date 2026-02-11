
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, RefreshCw, Filter, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, error
  const [selectedLog, setSelectedLog] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const refreshIntervalRef = useRef(null);

  const fetchLogs = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  // Initial load and filter change
  useEffect(() => {
    fetchLogs();
  }, [filter]);

  // Task 6: Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLogs(true);
      }, 5000); // 5 seconds
    } else {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, filter]);

  const StatusBadge = ({ status }) => {
    if (status === 'success') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Succès
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> Erreur
      </Badge>
    );
  };

  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Historique des Webhooks</h2>
           <p className="text-muted-foreground mt-1">
              Surveillance en temps réel des flux entrants.
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Task 6: Auto Refresh Toggle */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-md border border-gray-200 dark:border-slate-800">
            <Checkbox 
                id="auto-refresh" 
                checked={autoRefresh} 
                onCheckedChange={setAutoRefresh} 
            />
            <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
                Auto-refresh
            </Label>
            {lastRefresh && (
                <span className="text-xs text-muted-foreground ml-2 border-l pl-2 border-gray-200 dark:border-slate-700">
                    MAJ: {format(lastRefresh, 'HH:mm:ss')}
                </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-7 px-3 text-xs", filter === 'all' && "bg-white dark:bg-slate-700 shadow-sm")}
                    onClick={() => setFilter('all')}
                >
                    Tous
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-7 px-3 text-xs", filter === 'success' && "bg-white dark:bg-slate-700 shadow-sm text-emerald-600")}
                    onClick={() => setFilter('success')}
                >
                    Succès
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-7 px-3 text-xs", filter === 'error' && "bg-white dark:bg-slate-700 shadow-sm text-red-600")}
                    onClick={() => setFilter('error')}
                >
                    Erreurs
                </Button>
             </div>
             <Button variant="outline" size="sm" onClick={() => fetchLogs(false)} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
             </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Event ID</th>
                        <th className="px-6 py-3">Message</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && logs.length === 0 ? (
                        [1,2,3,4,5].map(i => (
                            <tr key={i} className="border-b border-gray-100 dark:border-slate-800">
                                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
                                <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded animate-pulse" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-full bg-gray-200 rounded animate-pulse" /></td>
                                <td className="px-6 py-4" />
                            </tr>
                        ))
                    ) : logs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Clock className="h-10 w-10 text-gray-300" />
                                    <p>Aucun log trouvé pour ce filtre.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        logs.map(log => (
                            <tr key={log.id} className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={log.status} />
                                </td>
                                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">
                                    {log.event_id || <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-4 max-w-md truncate" title={log.message || log.error_message}>
                                    {log.status === 'error' ? (
                                        <div className="flex flex-col">
                                            <span className="text-red-600 font-medium truncate">{log.error_message || "Erreur inconnue"}</span>
                                            {log.http_status && <span className="text-[10px] text-gray-400">HTTP {log.http_status}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-gray-700 dark:text-gray-300">{log.message || "Webhook reçu"}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    Détails du Webhook
                    {selectedLog && <StatusBadge status={selectedLog.status} />}
                </DialogTitle>
            </DialogHeader>
            {selectedLog && (
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                        <div>
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">ID Log</span>
                            <span className="font-mono text-xs">{selectedLog.id}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</span>
                            <span className="font-medium">{format(new Date(selectedLog.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: fr })}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Event ID</span>
                            <span className="font-medium">{selectedLog.event_id || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">HTTP Status</span>
                            <Badge variant="secondary">{selectedLog.http_status || 'N/A'}</Badge>
                        </div>
                    </div>

                    {selectedLog.error_message && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-md">
                            <h4 className="text-xs font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" /> Message d'erreur
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap">{selectedLog.error_message}</p>
                            {selectedLog.stack_trace && (
                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                    <p className="text-[10px] text-red-600 dark:text-red-400 font-mono overflow-x-auto whitespace-pre">
                                        {selectedLog.stack_trace}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payload Reçu (Request)</h4>
                        <ScrollArea className="h-48 w-full rounded-md border bg-slate-950 p-4 shadow-inner">
                            <pre className="text-xs text-slate-50 font-mono">
                                {selectedLog.payload ? JSON.stringify(selectedLog.payload, null, 2) : "Aucun payload"}
                            </pre>
                        </ScrollArea>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Réponse Envoyée</h4>
                        <ScrollArea className="h-32 w-full rounded-md border bg-slate-100 dark:bg-slate-900 p-4">
                            <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono">
                                {selectedLog.response ? JSON.stringify(selectedLog.response, null, 2) : "Aucune réponse enregistrée"}
                            </pre>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
