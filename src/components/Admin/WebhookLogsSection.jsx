
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function WebhookLogsSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);

  const pageSize = 20;

  // Task 7: Fetch from correct 'webhook_logs' table
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' });

      // Filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        // Search in error_message or message
        query = query.or(`message.ilike.%${filters.search}%,error_message.ilike.%${filters.search}%`);
      }

      // Pagination & Sort
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);

    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success': 
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Success</Badge>;
      case 'error': 
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"><AlertCircle className="w-3 h-3 mr-1"/> Error</Badge>;
      default: 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <CardTitle>Historique des Webhooks</CardTitle>
            <CardDescription>Journal des interactions webhook du système.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
             <Button variant="outline" size="sm" onClick={fetchLogs}>
                 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
             </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
           <Input 
              placeholder="Rechercher message..." 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
           />
           <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">Tous les status</SelectItem>
                 <SelectItem value="success">Success</SelectItem>
                 <SelectItem value="error">Error</SelectItem>
              </SelectContent>
           </Select>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 flex-1">
        <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px] whitespace-nowrap">Horodatage</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message / Erreur</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 && !loading && (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aucun log trouvé.</TableCell></TableRow>
                  )}
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.event_id || '-'}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs font-mono" title={log.error_message || log.message}>
                        {log.error_message 
                            ? <span className="text-red-600 truncate block">{log.error_message}</span> 
                            : <span className="text-gray-600 truncate block">{log.message}</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4 text-indigo-600" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
           <div className="text-sm text-gray-500">
              Page {page} sur {Math.max(1, Math.ceil(totalCount / pageSize))} ({totalCount} logs)
           </div>
           <div className="flex gap-2">
              <Button 
                variant="outline" size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
         <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Détails du Webhook</DialogTitle>
               <DialogDescription className="font-mono text-xs">{selectedLog?.id}</DialogDescription>
            </DialogHeader>
            {selectedLog && (
               <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                     <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Date</span>
                        <span className="font-medium">{new Date(selectedLog.created_at).toLocaleString()}</span>
                     </div>
                     <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Status</span>
                        {getStatusBadge(selectedLog.status)}
                     </div>
                      <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">HTTP Code</span>
                        <span className="font-mono">{selectedLog.http_status || 'N/A'}</span>
                     </div>
                     <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Event ID</span>
                        <span className="font-mono">{selectedLog.event_id || '-'}</span>
                     </div>
                  </div>
                  
                  {selectedLog.error_message && (
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded border border-red-200 dark:border-red-900/30">
                         <h4 className="font-semibold text-red-800 dark:text-red-400 text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Erreur détectée
                         </h4>
                         <p className="text-red-700 dark:text-red-300 text-xs font-mono whitespace-pre-wrap">{selectedLog.error_message}</p>
                         {selectedLog.stack_trace && (
                             <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/30">
                                <p className="text-[10px] text-red-600 dark:text-red-400 font-mono overflow-auto max-h-32">
                                    {selectedLog.stack_trace}
                                </p>
                             </div>
                         )}
                      </div>
                  )}

                  <div>
                     <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-mono">PAYLOAD</span>
                     </h4>
                     <div className="bg-slate-950 text-slate-100 p-4 rounded-lg border border-slate-800 shadow-inner overflow-hidden">
                        <pre className="overflow-x-auto text-xs font-mono custom-scrollbar p-2">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                        </pre>
                     </div>
                  </div>

                   {selectedLog.response && (
                      <div>
                         <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-xs font-mono">RESPONSE</span>
                         </h4>
                         <div className="bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 p-4 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <pre className="overflow-x-auto text-xs font-mono custom-scrollbar p-2">
                                {JSON.stringify(selectedLog.response, null, 2)}
                            </pre>
                         </div>
                      </div>
                   )}
               </div>
            )}
         </DialogContent>
      </Dialog>
    </Card>
  );
}
