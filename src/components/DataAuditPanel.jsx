
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { calculateOccupancyPercentage } from '@/lib/capacityCalculations';

// Comprehensive Data Audit Tool
const DataAuditPanel = () => {
  const [data, setData] = useState({ sessions: [], tickets: [], events: [] });
  const [stats, setStats] = useState({ ticketCount: 0, sessionCount: 0, eventCount: 0 });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const fetchFullAudit = async () => {
    setLoading(true);
    addLog('Starting full audit fetch...');
    try {
      // Fetch raw data using select * to ensure we get all columns regardless of schema changes
      const [sessions, tickets, events] = await Promise.all([
        supabase.from('petzi_sessions').select('*').limit(50),
        supabase.from('petzi_tickets').select('*').limit(50),
        supabase.from('petzi_events').select('*').limit(50).catch(() => ({ data: [] }))
      ]);

      const [sessionsCount, ticketsCount] = await Promise.all([
          supabase.from('petzi_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('petzi_tickets').select('*', { count: 'exact', head: true })
      ]);

      setData({
        sessions: sessions.data || [],
        tickets: tickets.data || [],
        events: events.data || []
      });
      
      setStats({
          ticketCount: ticketsCount.count || 0,
          sessionCount: sessionsCount.count || 0,
          eventCount: events.data?.length || 0
      });

      addLog(`Fetch complete. Tickets: ${ticketsCount.count}, Sessions: ${sessionsCount.count}`);
      
    } catch (e) {
      console.error("Audit Fetch Error:", e);
      addLog(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Occupancy Check for Audit
  const sampleOccupancy = () => {
      if (data.tickets.length === 0 || data.sessions.length === 0) return "No data";
      
      // Use correct column names: event_name for tickets, name for sessions
      const eventName = data.tickets[0].event_name;
      
      const relatedSessions = data.sessions.filter(s => 
        (s.name && eventName && s.name.includes(eventName)) || 
        // Link via ticket_id in session if available (though schema says ticket_id in session refers to petzi_tickets.id)
        s.ticket_id === data.tickets[0].id
      );
      
      return {
          ticketEventName: eventName,
          foundSessions: relatedSessions.length,
          sampleCapacity: relatedSessions[0]?.capacity || 'N/A',
          calculatedPct: calculateOccupancyPercentage(1, relatedSessions[0]?.capacity || 0)
      };
  };

  if (!isOpen) {
    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setIsOpen(true); fetchFullAudit(); }} 
            className="fixed bottom-4 left-4 z-50 bg-white shadow-lg border-purple-400 text-purple-700 hover:bg-purple-50"
        >
            <Database className="h-4 w-4 mr-2" /> Data Audit
        </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-5xl h-[80vh] flex flex-col bg-white dark:bg-slate-900 border-purple-200 shadow-2xl">
        <CardHeader className="py-3 px-4 bg-purple-50 dark:bg-purple-900/20 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-md font-mono flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <Database className="h-5 w-5 text-purple-600" />
                System Data Audit Panel
            </CardTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchFullAudit} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />} Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
        </CardHeader>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-2 flex gap-4 text-xs font-mono border-b">
            <div>Total Tickets: <strong>{stats.ticketCount}</strong></div>
            <div>Total Sessions: <strong>{stats.sessionCount}</strong></div>
            <div>Events Table: <strong>{stats.eventCount}</strong></div>
        </div>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            <Tabs defaultValue="tables" className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger value="tables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500">Raw Tables</TabsTrigger>
                    <TabsTrigger value="consistency" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500">Consistency Checks</TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500">Audit Logs</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-auto bg-slate-950 text-slate-300 p-4 font-mono text-xs">
                    <TabsContent value="tables" className="mt-0 space-y-4">
                        <div className="mb-4">
                            <h3 className="text-green-400 font-bold mb-1">petzi_tickets (First 50)</h3>
                            <pre className="overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">{JSON.stringify(data.tickets, null, 2)}</pre>
                        </div>
                        <div>
                            <h3 className="text-blue-400 font-bold mb-1">petzi_sessions (First 50)</h3>
                            <pre className="overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">{JSON.stringify(data.sessions, null, 2)}</pre>
                        </div>
                        <div>
                            <h3 className="text-purple-400 font-bold mb-1">petzi_events (First 50)</h3>
                            <pre className="overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">{JSON.stringify(data.events, null, 2)}</pre>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="consistency" className="mt-0">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900 rounded border border-slate-700">
                                <h3 className="text-yellow-400 font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Occupancy Logic Check
                                </h3>
                                <pre className="mt-2">{JSON.stringify(sampleOccupancy(), null, 2)}</pre>
                                <p className="mt-2 text-gray-500">Verifies if tickets map to sessions and capacity exists.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="mt-0">
                         {logs.map((log, i) => (
                             <div key={i} className="border-b border-slate-800 py-1 font-mono text-xs">{log}</div>
                         ))}
                    </TabsContent>
                </div>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataAuditPanel;
