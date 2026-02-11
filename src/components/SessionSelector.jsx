
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SessionSelector({ sessions, onSelect, loading, error }) {
  if (error) return <div className="text-red-500 text-sm">Erreur chargement sessions</div>;

  return (
    <div className="w-full">
      <Select onValueChange={(val) => {
        const selected = sessions.find(s => s.id.toString() === val);
        onSelect(selected);
      }}>
        <SelectTrigger className="w-full bg-white dark:bg-slate-800 dark:border-slate-700">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
               <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
            </div>
          ) : (
            <SelectValue placeholder="Sélectionner une session" />
          )}
        </SelectTrigger>
        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
          {sessions.length === 0 ? (
             <div className="p-2 text-sm text-gray-500 text-center">Aucune session future</div>
          ) : (
             sessions.map((session) => (
                <SelectItem key={session.id} value={session.id.toString()} className="dark:text-slate-200">
                   <div className="flex flex-col items-start">
                     <span className="font-medium">
                       {session.starts_at ? format(new Date(session.starts_at), "d MMMM yyyy 'à' HH:mm", { locale: fr }) : 'Date inconnue'}
                     </span>
                     <span className="text-xs text-gray-500 dark:text-slate-400">
                       {session.location_name || 'Lieu inconnu'} • {session.capacity > 0 ? `${session.capacity} places` : 'Capacité non définie'}
                     </span>
                   </div>
                </SelectItem>
             ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default SessionSelector;
