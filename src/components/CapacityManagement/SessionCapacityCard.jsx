
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Calendar, Clock, Users, Ticket, Check } from 'lucide-react';
import CapacityChangeHandler from './CapacityChangeHandler';
import { getSessionCapacityInfo } from '@/lib/capacityService';

const SessionCapacityCard = ({ session, onCapacityUpdate }) => {
  const [metrics, setMetrics] = useState({ capacityTotal: session.capacity || 0, reserved: 0, available: 0 });
  const [loading, setLoading] = useState(false);

  // Sync metrics on mount or session change
  useEffect(() => {
    refreshMetrics();
  }, [session.id, session.capacity]);

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // Use helper to get latest reservation counts
      const info = await getSessionCapacityInfo(session.id);
      setMetrics(info);
    } catch (error) {
      console.error("Failed to load session metrics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = (newCapacity) => {
    // Optimistic update of local metrics
    setMetrics(prev => ({
        ...prev,
        capacityTotal: newCapacity,
        available: Math.max(0, newCapacity - prev.reserved)
    }));
    // Trigger parent refresh
    if (onCapacityUpdate) onCapacityUpdate();
  };

  const { capacityTotal, reserved, available } = metrics;
  const fillRate = capacityTotal > 0 ? Math.round((reserved / capacityTotal) * 100) : (reserved > 0 ? 100 : 0);
  
  const getFillColor = (pct) => {
      if (pct >= 100) return 'text-red-600 bg-red-50 border-red-100';
      if (pct >= 80) return 'text-orange-600 bg-orange-50 border-orange-100';
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-indigo-500">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          
          {/* Header: Name and Date */}
          <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {session.name || 'Session Standard'}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                     <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {session.starts_at ? format(new Date(session.starts_at), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                     </span>
                     <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {session.starts_at ? format(new Date(session.starts_at), 'HH:mm') : '--:--'}
                     </span>
                </div>
            </div>
            <Badge variant="outline" className={getFillColor(fillRate)}>
                {fillRate}% rempli
            </Badge>
          </div>

          <div className="h-px bg-gray-100 dark:bg-slate-800" />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
             
             {/* 1. Capacity (Editable) */}
             <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                    <Users className="h-3 w-3" /> Capacité Totale
                </span>
                <CapacityChangeHandler 
                    sessionId={session.id}
                    currentCapacity={capacityTotal}
                    onUpdate={handleUpdateSuccess}
                />
             </div>

             {/* 2. Reserved */}
             <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                    <Ticket className="h-3 w-3" /> Réservés
                </span>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {reserved}
                </span>
             </div>

             {/* 3. Available */}
             <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Disponibles
                </span>
                <span className={`text-2xl font-bold ${available === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {available}
                </span>
             </div>
          </div>
          
          {/* Location Footer */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
             <MapPin className="h-3 w-3" />
             {session.location_name || session.location_city || 'Lieu non spécifié'}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCapacityCard;
