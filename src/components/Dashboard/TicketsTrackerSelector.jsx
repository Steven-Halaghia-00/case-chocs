
import React, { useEffect, useState } from 'react';
import { classifyAllEvents } from '@/lib/eventClassificationService';
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown';

export default function TicketsTrackerSelector({ selectedEvents = [], onSelectEvents }) {
  const [activeEvents, setActiveEvents] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive selection state for each dropdown based on the global selection
  const selectedActiveIds = selectedEvents.filter(id => activeEvents.some(e => e.id === id));
  const selectedArchivedIds = selectedEvents.filter(id => archivedEvents.some(e => e.id === id));

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const { active, archived } = await classifyAllEvents();
        setActiveEvents(active);
        setArchivedEvents(archived);
      } catch (error) {
        console.error("Failed to load events for selector", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleActiveChange = (newActiveIds) => {
    // Combine new active IDs with existing archived IDs
    const combined = [...newActiveIds, ...selectedArchivedIds];
    onSelectEvents(combined);
  };

  const handleArchivedChange = (newArchivedIds) => {
    // Combine existing active IDs with new archived IDs
    const combined = [...selectedActiveIds, ...newArchivedIds];
    onSelectEvents(combined);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MultiSelectDropdown 
        label="Événements Actifs"
        placeholder="Choisir des événements actifs..."
        options={activeEvents}
        selectedIds={selectedActiveIds}
        onSelectionChange={handleActiveChange}
        loading={loading}
      />

      <MultiSelectDropdown 
        label="Événements Archivés"
        placeholder="Choisir des événements archivés..."
        options={archivedEvents}
        selectedIds={selectedArchivedIds}
        onSelectionChange={handleArchivedChange}
        loading={loading}
      />
    </div>
  );
}
