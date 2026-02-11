
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bug, RefreshCw, Trash2, Maximize2, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function WebhookDebugPanel() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [viewPayload, setViewPayload] = useState(null);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('petzi_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Safe limit

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setLogs(data || []);
      
    } catch (err) {
      console.error(err);
      if (err.code !== 'PGRST116') {
          toast({
             variant: "destructive",
             title: "Erreur",
             description: "Impossible de charger les logs de débogage."
          });
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const handleRetry = async (log) => {
      toast({
          title: "Retrying...",
          description: "Envoi du payload à la fonction..."
      });
      
      try {
          const { data, error } = await supabase.functions.invoke('process-petzi-webhook', {
             body: log.payload
          });
          
          if (error) throw error;

          toast({
             title: "Succès",
             description: "Webhook rejoué avec succès.",
             className: "bg-green-50 text-green-900 border-green-200"
          });
          fetchLogs();
      } catch (e) {
          toast({
             variant: "destructive",
             title: "Échec du rejeu",
             description: e.message
          });
      }
  };

  const handleClearLogs = async () => {
     if (!confirm("Voulez-vous vraiment supprimer TOUS les logs webhooks ?")) return;
     
     try {
         const { error } = await supabase.from('petzi_webhook_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
         if (error) throw error;
         
         toast({ title: "Logs effacés", description: "La table de logs a été vidée." });
         fetchLogs();
     } catch (e) {
         toast({ variant: "destructive", title: "Erreur", description: e.message });
     }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Débogage</CardTitle>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
        
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full mt-2">
           <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
              <TabsTrigger value="success" className="text-xs text-green-700">OK</TabsTrigger>
              <TabsTrigger value="error" className="text-xs text-red-700">Err</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs text-yellow-700">...</TabsTrigger>
           </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] w-full">
            <div className="divide-y">
                {logs.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">Aucun log trouvé.</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`
                                    ${log.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                    ${log.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                    ${log.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                `}>
                                    {log.status}
                                </Badge>
                                <span className="text-xs font-mono text-gray-500">
                                    {format(new Date(log.created_at), 'HH:mm:ss')}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewPayload(log)}>
                                    <Maximize2 className="h-3 w-3 text-gray-400" />
                                </Button>
                                {log.status === 'error' && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRetry(log)}>
                                        <PlayCircle className="h-3 w-3 text-indigo-500" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        <div className="mb-2">
                            <span className="font-semibold text-sm block truncate">{log.event_type}</span>
                            {log.error_message && (
                                <p className="text-xs text-red-600 mt-1 font-mono break-all bg-red-50 p-1 rounded">
                                    {log.error_message}
                                </p>
                            )}
                        </div>

                        <div className="bg-slate-900 rounded p-2 overflow-hidden">
                            <code className="text-xs text-green-400 font-mono block truncate">
                                {JSON.stringify(log.payload)}
                            </code>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={!!viewPayload} onOpenChange={(open) => !open && setViewPayload(null)}>
         <DialogContent className="max-w-2xl">
             <DialogHeader>
                 <DialogTitle>Payload</DialogTitle>
                 <DialogDescription className="text-xs font-mono">{viewPayload?.id}</DialogDescription>
             </DialogHeader>
             <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[60vh] font-mono text-sm">
                 <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                     {JSON.stringify(viewPayload?.payload, null, 2)}
                 </pre>
             </div>
         </DialogContent>
      </Dialog>
    </Card>
  );
}
