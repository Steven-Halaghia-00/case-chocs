
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Ticket, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe
    const ticketChannel = supabase
      .channel('activity-feed-tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'petzi_tickets' }, () => fetchActivities())
      .subscribe();

    return () => supabase.removeChannel(ticketChannel);
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Task 10: Query activity with session/event details
      // Updated to select ticket_number instead of ticket_id
      const { data: tickets, error } = await supabase
        .from('petzi_tickets')
        .select(`
            id, 
            ticket_number,
            created_at, 
            petzi_sessions (
                starts_at,
                capacity,
                petzi_events (
                    name
                )
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = tickets.map(t => {
          const session = t.petzi_sessions;
          const eventName = session?.petzi_events?.name || 'Événement inconnu';
          const sessionDate = session?.starts_at ? format(new Date(session.starts_at), "d MMM HH:mm", { locale: fr }) : '?';
          
          return {
              id: t.id,
              type: 'ticket',
              // Use ticket_number for display
              message: `Ticket ${t.ticket_number || t.id} vendu`,
              subMessage: `${eventName} – Session: ${sessionDate}`,
              time: t.created_at
          };
      });

      setActivities(formatted);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-gray-400" /></div>;

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4">
        {activities.length === 0 ? (
            <div className="text-gray-500 text-sm text-center">Aucune activité récente.</div>
        ) : (
            activities.map((item) => (
            <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 dark:hover:bg-slate-800">
                <div className="mt-1">
                    <div className="bg-indigo-100 p-2 rounded-full dark:bg-indigo-900/30">
                        <Ticket className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                        {item.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.subMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: fr })}
                    </p>
                </div>
            </div>
            ))
        )}
      </div>
    </ScrollArea>
  );
}

export default ActivityFeed;
