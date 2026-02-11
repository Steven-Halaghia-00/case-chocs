
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEventsWithSessionCount, getSessionsForEvent } from '@/lib/capacityService';
import SessionCapacityCard from '@/components/CapacityManagement/SessionCapacityCard';
import { ScrollArea } from '@/components/ui/scroll-area';

const CapacityManagement = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [sessions, setSessions] = useState([]);
  
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState(null);

  // Load Events on Mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Load Sessions when Event Selected
  useEffect(() => {
    if (selectedEventId) {
      fetchSessions(selectedEventId);
    } else {
      setSessions([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      setError(null);
      const data = await getEventsWithSessionCount();
      setEvents(data || []);
      
      // Auto-select first event if none selected and events exist
      if (!selectedEventId && data && data.length > 0) {
          setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la liste des événements.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchSessions = async (eventId) => {
    try {
      setLoadingSessions(true);
      const data = await getSessionsForEvent(eventId);
      setSessions(data || []);
    } catch (err) {
      console.error(err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionUpdate = () => {
      if (selectedEventId) {
          fetchSessions(selectedEventId);
      }
  };

  if (loadingEvents && events.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-gray-500">Chargement des événements...</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-8 text-center bg-red-50 rounded-lg text-red-600 border border-red-100">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchEvents}>Réessayer</Button>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      
      {/* Left Sidebar: Event List */}
      <Card className="lg:col-span-4 xl:col-span-3 flex flex-col h-full overflow-hidden border-gray-200 dark:border-slate-800">
         <div className="p-4 border-b bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
             <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <CalendarDays className="h-4 w-4" /> Événements
             </h3>
             <Button variant="ghost" size="icon" onClick={fetchEvents} title="Rafraîchir">
                 <RefreshCw className="h-4 w-4" />
             </Button>
         </div>
         <ScrollArea className="flex-1">
             <div className="p-2 space-y-1">
                 {events.map(event => (
                     <button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        className={cn(
                            "w-full text-left px-3 py-3 rounded-md text-sm transition-all duration-200 flex items-center justify-between group",
                            selectedEventId === event.id 
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800" 
                                : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
                        )}
                     >
                        <span className="truncate pr-2">{event.name}</span>
                        {selectedEventId === event.id && <ChevronRight className="h-4 w-4 opacity-50" />}
                     </button>
                 ))}
                 {events.length === 0 && (
                     <p className="text-center text-sm text-gray-400 py-8">Aucun événement trouvé</p>
                 )}
             </div>
         </ScrollArea>
      </Card>

      {/* Right Content: Sessions List */}
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {events.find(e => e.id === selectedEventId)?.name || 'Sélectionnez un événement'}
              </h2>
              <span className="text-sm text-gray-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border shadow-sm">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
          </div>

          <ScrollArea className="flex-1 pr-4">
              {loadingSessions ? (
                  <div className="flex flex-col items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
                      <p className="text-sm text-gray-400">Chargement des sessions...</p>
                  </div>
              ) : sessions.length > 0 ? (
                  <div className="space-y-4 pb-12">
                      {sessions.map(session => (
                          <SessionCapacityCard 
                              key={session.id} 
                              session={session} 
                              onCapacityUpdate={handleSessionUpdate}
                          />
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      <CalendarDays className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500">Aucune session pour cet événement</p>
                  </div>
              )}
          </ScrollArea>
      </div>
    </div>
  );
};

export default CapacityManagement;
