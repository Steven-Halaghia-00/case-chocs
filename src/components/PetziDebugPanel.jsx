
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, RefreshCw, Terminal } from 'lucide-react';

export default function PetziDebugPanel() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Logs
      const { data: logData } = await supabase
        .from('petzi_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setLogs(logData || []);

      // Fetch Summary (Events)
      const { data: eventData } = await supabase
        .from('petzi_events')
        .select('id, name, promoter, petzi_sessions(count)');
      setSummary(eventData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-gray-500" />
            <CardTitle>Petzi Debug Panel</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs">Webhook Logs</TabsTrigger>
            <TabsTrigger value="events">Database Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs">
            <ScrollArea className="h-[400px] rounded-md border p-4 bg-slate-950 text-slate-100 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs found.</div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="border-b border-slate-800 pb-2 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                        <Badge variant={log.status === 'success' ? 'outline' : 'destructive'} className="h-5 text-[10px]">
                          {log.event_type}
                        </Badge>
                      </div>
                      <div className="text-slate-300 break-words">
                        {log.error_message || JSON.stringify(log.payload).slice(0, 150) + '...'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="events">
             <div className="border rounded-md">
               <table className="w-full text-sm">
                 <thead className="bg-gray-50 dark:bg-slate-900 border-b">
                   <tr>
                     <th className="p-2 text-left">Event Name</th>
                     <th className="p-2 text-left">Promoter</th>
                     <th className="p-2 text-right">Sessions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {summary.map(evt => (
                     <tr key={evt.id} className="border-b last:border-0">
                       <td className="p-2">{evt.name}</td>
                       <td className="p-2 text-gray-500">{evt.promoter}</td>
                       <td className="p-2 text-right">{evt.petzi_sessions?.[0]?.count || 0}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
