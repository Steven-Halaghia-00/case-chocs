
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Calendar, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { classifyAllEvents } from '@/lib/eventClassificationService';
import { Input } from '@/components/ui/input';

export default function UnifiedEventSelector({ selectedEvents = [], onSelectEvents, eventsData = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalEvents, setInternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const isMounted = useRef(true);

  // Task 2: Fix infinite loading loop & cleanup
  useEffect(() => {
    isMounted.current = true;
    
    // Only fetch if eventsData is NOT provided
    if (eventsData && eventsData.length > 0) {
      if (isMounted.current) {
        setInternalEvents(eventsData);
        setLoading(false);
      }
      return;
    }

    async function loadEvents() {
      if (isMounted.current) setLoading(true);
      try {
        const { active, archived } = await classifyAllEvents();
        const all = [...active, ...archived].sort((a, b) => {
          if (!a.lastSessionDate) return 1;
          if (!b.lastSessionDate) return -1;
          return new Date(b.lastSessionDate) - new Date(a.lastSessionDate);
        });
        
        if (isMounted.current) {
          setInternalEvents(all);
        }
      } catch (error) {
        console.error("Failed to load events", error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }
    
    loadEvents();

    return () => {
      isMounted.current = false;
    };
  }, []); // Task 2: Empty dependency array to prevent infinite re-renders

  // Task 2: Handle prop updates separately if needed, but carefully
  useEffect(() => {
    if (eventsData && eventsData.length > 0 && isMounted.current) {
        setInternalEvents(eventsData);
        setLoading(false);
    }
  }, [eventsData]);

  // Task 2: Fix click outside listener cleanup
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleEvent = (eventId) => {
    const newSelection = selectedEvents.includes(eventId)
      ? selectedEvents.filter(id => id !== eventId)
      : [...selectedEvents, eventId];
    onSelectEvents(newSelection);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onSelectEvents([]);
  };

  const filteredEvents = internalEvents.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full md:max-w-md" ref={dropdownRef}>
      <div
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer transition-all",
          isOpen 
            ? "ring-2 ring-indigo-500/20 border-indigo-500" 
            : "border-input hover:border-gray-400 dark:hover:border-slate-600 shadow-sm",
          loading && "opacity-50 cursor-wait"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {selectedEvents.length > 0 ? (
            <>
              <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 h-6 px-2">
                {selectedEvents.length}
              </Badge>
              <span className="font-medium truncate text-foreground">
                {selectedEvents.length === 1 ? "événement sélectionné" : "événements sélectionnés"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Sélectionner des événements...</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground ml-2">
          {selectedEvents.length > 0 && (
            <div 
              role="button"
              onClick={clearSelection}
              className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </div>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un événement..." 
                className="pl-9 h-9 bg-background border-gray-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          <ScrollArea className="h-[320px]">
            <div className="p-2 space-y-1">
              {filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Aucun événement trouvé
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const isSelected = selectedEvents.includes(event.id);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleToggleEvent(event.id)}
                      className={cn(
                        "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all border border-transparent select-none",
                        isSelected 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" 
                          : "hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors",
                        isSelected 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "border-gray-300 dark:border-slate-600 group-hover:border-indigo-400"
                      )}>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("font-medium truncate", isSelected && "text-indigo-700 dark:text-indigo-300")}>
                            {event.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                            <Badge 
                                variant="outline"
                                className={cn(
                                "text-[10px] h-5 px-1.5 font-medium border-0",
                                event.isActive 
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                    : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                                )}
                            >
                                {event.isActive ? 'ACTIF' : 'ARCHIVÉ'}
                            </Badge>
                            
                            {event.lastSessionDate && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white dark:bg-slate-900/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-800">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        J0: {format(parseISO(event.lastSessionDate), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
