
import React from 'react';
import EventStatisticsCard from './EventStatisticsCard';

export default function EventStatisticsGrid({ selectedEventIds, selectedEvents }) {
  if (!selectedEventIds || selectedEventIds.length === 0) {
    return null;
  }

  // Create a map of id -> name for easy lookup if selectedEvents object is passed,
  // otherwise we might need to find names elsewhere. 
  // Assuming selectedEvents is an array of objects {id, name} or just IDs.
  // Based on ComparativeSalesCurvesSection, selectedEvents is just IDs, 
  // but we can pass names separately or fetch inside card.
  // The card component accepts eventName. We need to derive it.
  
  // Actually, ComparativeSalesCurvesSection has eventNames state. We should pass that map.
  // But strictly following props: "selectedEventIds" and "selectedEvents".
  // If selectedEvents is the full object array, we use it. If it's just IDs, we might have an issue.
  // Let's assume the parent passes a way to get names, or selectedEvents is the array of objects.

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Statistiques des événements
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-medium text-gray-600 dark:text-gray-400">
          {selectedEventIds.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {selectedEventIds.map(eventId => {
          // Find name from selectedEvents array if available, or fallback
          const eventObj = Array.isArray(selectedEvents) 
            ? selectedEvents.find(e => e.id === eventId) 
            : null;
            
          const eventName = eventObj?.name || `Événement ${eventId}`;

          return (
            <EventStatisticsCard 
              key={eventId} 
              eventId={eventId} 
              eventName={eventName} 
            />
          );
        })}
      </div>
    </div>
  );
}
