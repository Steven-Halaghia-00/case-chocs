
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Calendar, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const KPICard = ({ title, value, icon: Icon, loading, colorClass }) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-transparent hover:border-l-indigo-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {Icon && <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
             <Icon className={`h-4 w-4 ${colorClass.replace('bg-', 'text-')}`} />
          </div>}
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function GlobalKPIs({ data, loading }) {
  const { 
    totalTickets = 0, 
    activeEvents = 0, 
    totalRevenue = 0 
  } = data || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard 
        title="TICKETS VENDUS" 
        value={totalTickets.toLocaleString('fr-CH')} 
        icon={Ticket} 
        colorClass="text-blue-600 bg-blue-600"
        loading={loading}
      />

      <KPICard 
        title="ÉVÉNEMENTS" 
        value={activeEvents} 
        icon={Calendar} 
        colorClass="text-purple-600 bg-purple-600"
        loading={loading}
      />

      <KPICard 
        title="REVENU TOTAL" 
        value={`CHF ${totalRevenue.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
        icon={DollarSign} 
        colorClass="text-green-600 bg-green-600"
        loading={loading}
      />
    </div>
  );
}
