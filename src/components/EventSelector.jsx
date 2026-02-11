
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/customSupabaseClient';
import { useActiveEvents } from '@/hooks/useActiveEvents';

function EventSelector({ onSelectEvent, onSelectSession }) {
  const { events, loading: eventsLoading, error: eventsError } = useActiveEvents();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  const handleEventChange = async (val) => {
    setSelectedEventId(val);
    setSessions([]);
    
    // Notify parent about event change (session is null initially)
    if (onSelectEvent) onSelectEvent(val);
    
    if (val && val !== 'global') {
        try {
            setSessionsLoading(true);
            const now = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('petzi_sessions')
                .select('*')
                .eq('event_id', val)
                .gte('starts_at', now)
                .order('starts_at', { ascending: true });
                
            if (error) throw error;
            setSessions(data || []);
            
            if (onSelectSession) onSelectSession(data || []); // Pass fetched sessions to parent
            
        } catch (e) {
            console.error("Error fetching sessions:", e);
        } finally {
            setSessionsLoading(false);
        }
    } else {
        if (onSelectSession) onSelectSession([]);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-lg dark:bg-indigo-900/30">
            <LayoutDashboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">Tableau de Bord Événements</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Analysez par événement et session</p>
          </div>
        </div>

        <div className="w-full sm:w-auto min-w-[250px]">
          <Select value={selectedEventId || "global"} onValueChange={handleEventChange}>
            <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              {eventsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                  </div>
              ) : (
                  <SelectValue placeholder="Sélectionner un événement" />
              )}
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
              <SelectItem value="global" className="font-medium text-indigo-700 dark:text-indigo-400">
                Vue Globale
              </SelectItem>
              <div className="my-1 border-t border-gray-100 mx-2 dark:border-slate-700" />
              {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()} className="dark:text-slate-200">
                      {event.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {eventsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erreur chargement événements</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default EventSelector;
