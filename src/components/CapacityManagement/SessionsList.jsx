
import React from 'react';
import SessionCapacityCard from './SessionCapacityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Ticket } from 'lucide-react';

const SessionsList = ({ sessions, loading, selectedEventId, onUpdateSession }) => {
  if (!selectedEventId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-900/50">
        <Layers className="h-16 w-16 text-gray-200 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200">Aucun événement sélectionné</h3>
        <p className="text-gray-500 dark:text-slate-400 max-w-sm">
          Veuillez sélectionner un événement dans la liste de gauche pour gérer ses sessions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between gap-4">
              <div className="space-y-2 w-1/2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-32 w-[350px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-center shadow-sm">
        <Ticket className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200">Aucune session trouvée</h3>
        <p className="text-gray-500 dark:text-slate-400 max-w-sm mt-1">
          Cet événement ne semble pas avoir de sessions synchronisées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">
          Sessions ({sessions.length})
        </h2>
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">
          ID Événement: {selectedEventId}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sessions.map((session) => (
          <SessionCapacityCard
            key={session.id}
            session={session}
            onUpdate={onUpdateSession}
          />
        ))}
      </div>
    </div>
  );
};

export default SessionsList;
