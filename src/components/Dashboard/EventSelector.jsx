
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllEventsForSelector } from '@/lib/dashboardService';

export default function EventSelector({ selectedEvents, onSelectEvents }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const data = await getAllEventsForSelector();
      setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, []);

  const toggleEvent = (eventId) => {
    const isSelected = selectedEvents.includes(eventId);
    if (isSelected) {
      onSelectEvents(selectedEvents.filter(id => id !== eventId));
    } else {
      onSelectEvents([...selectedEvents, eventId]);
    }
  };

  const clearSelection = () => onSelectEvents([]);

  // Derived state for display
  const selectedCount = selectedEvents.length;
  const selectedObjects = events.filter(e => selectedEvents.includes(e.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sélectionner des événements pour analyse
        </label>
        {selectedCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            Tout effacer
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={isOpen}
              className="w-full sm:w-[300px] justify-between text-left font-normal"
            >
              <span className="truncate">
                {selectedCount === 0 
                  ? "Choisir des événements..." 
                  : `${selectedCount} événement${selectedCount > 1 ? 's' : ''} sélectionné(s)`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[300px] p-0" align="start">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
              Liste des événements
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
              ) : events.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Aucun événement trouvé</div>
              ) : (
                <div className="p-1">
                  {events.map((event) => (
                    <DropdownMenuCheckboxItem
                      key={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      className="cursor-pointer text-sm py-2"
                    >
                      <span className="truncate">{event.name}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Selected Tags Display */}
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {selectedObjects.slice(0, 3).map(event => (
            <Badge key={event.id} variant="secondary" className="h-9 px-3 text-sm font-normal gap-1">
              {event.name}
              <button 
                onClick={() => toggleEvent(event.id)}
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Retirer</span>
              </button>
            </Badge>
          ))}
          {selectedCount > 3 && (
            <Badge variant="outline" className="h-9 text-sm text-muted-foreground">
              +{selectedCount - 3} autres
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
