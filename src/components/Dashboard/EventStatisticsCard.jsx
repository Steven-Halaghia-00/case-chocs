
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, CalendarDays, Ticket, Loader2 } from 'lucide-react';
import { getEventAnalysis } from '@/lib/dashboardService';
import { cn } from '@/lib/utils';

export default function EventStatisticsCard({ eventId, eventName }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await getEventAnalysis([eventId]);
        if (data && data.length > 0) {
          setStats(data[0]);
        }
      } catch (error) {
        console.error(`Error fetching stats for event ${eventId}:`, error);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchStats();
    }
  }, [eventId]);

  const StatBox = ({ label, value, icon: Icon, colorClass }) => (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-semibold text-gray-500">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", colorClass)} />
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
        {loading ? (
          <div className="h-6 w-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-4 px-4 bg-gray-50/50 dark:bg-slate-900/50 border-b">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={eventName}>
          {eventName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <StatBox 
            label="Remplissage" 
            value={stats ? `${stats.fillRate}%` : '0%'} 
            icon={Users} 
            colorClass="text-blue-500" 
          />
          <StatBox 
            label="Recette" 
            value={stats ? `CHF ${stats.revenue.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'CHF 0'} 
            icon={DollarSign} 
            colorClass="text-green-500" 
          />
          <StatBox 
            label="Sessions" 
            value={stats ? stats.sessions : 0} 
            icon={CalendarDays} 
            colorClass="text-purple-500" 
          />
          <StatBox 
            label="Tickets" 
            value={stats ? stats.tickets : 0} 
            icon={Ticket} 
            colorClass="text-orange-500" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
