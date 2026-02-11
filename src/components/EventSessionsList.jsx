import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { logQuery } from '@/lib/queryLogger';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Task 5: Displays sessions related to the current context (e.g., ticket's session).
 * Fetches sibling sessions using the logic: sessions sharing the same event_id.
 * 
 * @param {string|number} contextSessionId - The ID of a session to find siblings for.
 */
function EventSessionsList({ contextSessionId, selectedEvent, sessions: propSessions }) {
  const [sessions, setSessions] = useState(propSessions || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If props are provided directly (Dashboard usage), use them. 
  // If contextSessionId is provided (TicketDetail usage), fetch.
  const isSelfFetching = !!contextSessionId && !propSessions;

  useEffect(() => {
    if (propSessions) {
      setSessions(propSessions);
      return;
    }

    if (!contextSessionId) return;

    async function fetchSiblingSessions() {
      setLoading(true);
      try {
        // Task 5 Query: SELECT ps.* FROM petzi_sessions ps WHERE ps.event_id = (SELECT event_id FROM petzi_sessions WHERE id = ?)
        // We do this in two steps with Supabase client to avoid complex raw SQL if possible, 
        // but since we need the subquery logic, we can chain it.
        // Actually, we can fetch the event_id for the session, then fetch all sessions.
        
        // Step 1: Get Event ID
        const { data: currentSession, error: sError } = await supabase
            .from('petzi_sessions')
            .select('event_id')
            .eq('id', contextSessionId)
            .single();
            
        if (sError) throw sError;
        if (!currentSession) throw new Error("Session not found");

        const eventId = currentSession.event_id;

        // Step 2: Fetch all sessions for this event
        const { data: siblings, error: fError } = await supabase
            .from('petzi_sessions')
            .select('*')
            .eq('event_id', eventId)
            .order('starts_at', { ascending: true });
            
        await logQuery('EventSessionsList', 'Fetch Sibling Sessions', { contextSessionId, eventId }, { data: siblings, error: fError });

        if (fError) throw fError;
        setSessions(siblings || []);

      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Impossible de charger les sessions.");
      } finally {
        setLoading(false);
      }
    }

    fetchSiblingSessions();
  }, [contextSessionId, propSessions]);


  if (loading) {
    return (
        <Card className="border-gray-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
               <div className="flex items-center gap-2 text-indigo-600">
                 <Loader2 className="h-5 w-5 animate-spin" /> Chargement des sessions...
               </div>
            </CardHeader>
            <CardContent className="h-24" />
        </Card>
    );
  }

  if (error) {
     return (
        <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded-md">
           {error}
        </div>
     );
  }

  if (sessions.length === 0) {
    if (isSelfFetching) return null; // Don't show empty card if fetching failed silently or returned 0
    return (
        <Card className="border-gray-200 shadow-sm bg-gray-50/50 border-dashed dark:bg-slate-900/50 dark:border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-gray-500 font-medium dark:text-slate-400">Aucune session trouvée.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="border-b border-gray-100 pb-4 dark:border-slate-800">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Sessions de l'événement
            </CardTitle>
            <Badge variant="secondary">{sessions.length} Session(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {sessions.map((session, idx) => {
            const capacity = session.capacity || 0;
            const locationName = typeof session.location === 'object' ? session.location?.name : session.location;
            const doorsAt = session.doors_at;

            return (
                <div key={session.id || idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-900 text-lg dark:text-slate-100">
                                {session.name || "Session"}
                            </h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-slate-400">
                                {session.starts_at && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-indigo-500" />
                                        <span className="font-semibold">Début:</span>
                                        <span>{formatDate(session.starts_at, "d MMM yyyy HH:mm")}</span>
                                    </div>
                                )}
                                {doorsAt && (
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>Portes: {formatDate(doorsAt, "HH:mm")}</span>
                                    </div>
                                )}
                                {locationName && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                                        <span>{locationName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {capacity > 0 && (
                            <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                    Capacité: {capacity}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </CardContent>
    </Card>
  );
}

export default EventSessionsList;