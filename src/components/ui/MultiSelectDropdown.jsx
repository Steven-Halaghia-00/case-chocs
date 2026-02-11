
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MultiSelectDropdown({
  label,
  placeholder = "Sélectionner...",
  options = [],
  selectedIds = [],
  onSelectionChange,
  loading = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.current)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleOption = (optionId) => {
    const newSelection = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    onSelectionChange(newSelection);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !loading && setIsOpen(!isOpen)}
          disabled={loading}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            isOpen && "ring-2 ring-ring ring-offset-2 border-primary"
          )}
        >
          <span className="truncate mr-2">
            {loading ? (
              <span className="text-muted-foreground">Chargement...</span>
            ) : selectedIds.length > 0 ? (
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="px-1.5 h-5 text-xs font-normal">
                  {selectedIds.length}
                </Badge>
                <span className="font-medium text-foreground">
                  {selectedIds.length === 1 
                    ? "événement sélectionné" 
                    : "événements sélectionnés"}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <div className="flex items-center gap-1">
             {selectedIds.length > 0 && (
                <div 
                  role="button"
                  onClick={handleClear}
                  className="rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors mr-1"
                >
                  <X className="h-3.5 w-3.5" />
                </div>
             )}
             <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[300px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
            <ScrollArea className="max-h-[256px]">
              <div className="p-1">
                {options.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Aucun événement disponible
                  </div>
                ) : (
                  options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        onClick={() => handleToggleOption(option.id)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-start gap-2 rounded-sm px-2 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          isSelected && "bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary mt-0.5",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}>
                          <Check className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="font-medium truncate">{option.name}</span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {option.lastSessionDate 
                                ? `J0: ${format(parseISO(option.lastSessionDate), 'dd MMM yyyy', { locale: fr })}`
                                : 'Date inconnue'}
                            </span>
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
    </div>
  );
}
