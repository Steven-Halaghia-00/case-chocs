
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EventSelector = ({ events, selectedEventId, onSelectEvent, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
        <span className="text-sm text-gray-500 animate-pulse">Chargement des événements...</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-gray-50 rounded-lg border">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Aucun événement trouvé.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          Événements ({events.length})
        </h3>
        <p className="text-xs text-gray-500 mt-1">Sélectionnez un événement pour gérer sa jauge.</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {events.map((event) => {
            const isSelected = selectedEventId && event.id.toString() === selectedEventId.toString();
            return (
              <Button
                key={event.id}
                variant="ghost"
                onClick={() => onSelectEvent(event.id)}
                className={cn(
                  "w-full justify-between h-auto py-3 px-4 text-left font-normal transition-all",
                  isSelected 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800" 
                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border border-transparent"
                )}
              >
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium">{event.name}</span>
                  <span className="text-xs opacity-70 truncate">{event.promoter || 'Sans promoteur'}</span>
                </div>
                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    event.sessionCount > 0 
                      ? "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                      : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                  )}>
                    {event.sessionCount}
                  </span>
                  {isSelected && <ChevronRight className="h-4 w-4" />}
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EventSelector;
