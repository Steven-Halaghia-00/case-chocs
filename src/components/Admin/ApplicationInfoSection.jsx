
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Shield, Globe, Cpu } from 'lucide-react';

export default function ApplicationInfoSection() {
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    async function getStats() {
      // Calculate derived stats
      const { count: tickets } = await supabase.from('petzi_tickets').select('*', { count: 'exact', head: true });
      const { count: sessions } = await supabase.from('petzi_sessions').select('*', { count: 'exact', head: true });
      const { data: capacityData } = await supabase.from('petzi_sessions').select('capacity');
      
      const totalCapacity = capacityData?.reduce((acc, curr) => acc + (curr.capacity || 0), 0) || 0;
      const avgTickets = sessions > 0 ? (tickets / sessions).toFixed(1) : 0;
      const avgCapacity = sessions > 0 ? (totalCapacity / sessions).toFixed(1) : 0;

      setDbStats({ avgTickets, avgCapacity, tickets, sessions });
    }
    getStats();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
       <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-indigo-500" />
                Information Système
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Nom de l'application</span>
                <span className="font-semibold">Petzi Billetterie</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Version</span>
                <Badge variant="outline">1.0.0</Badge>
             </div>
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Environnement</span>
                <Badge className="bg-green-100 text-green-800">Production</Badge>
             </div>
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Navigateur</span>
                <span className="text-sm truncate max-w-[200px]" title={navigator.userAgent}>{navigator.userAgent}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Heure Serveur (Local)</span>
                <span className="font-mono">{new Date().toLocaleString()}</span>
             </div>
          </CardContent>
       </Card>

       <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-indigo-500" />
                Statistiques Base de Données
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">URL Supabase</span>
                <span className="font-mono text-xs bg-gray-100 p-1 rounded">********.supabase.co</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Moyenne Tickets / Session</span>
                <span className="font-bold">{dbStats?.avgTickets || '-'}</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Moyenne Capacité / Session</span>
                <span className="font-bold">{dbStats?.avgCapacity || '-'}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Remplissage Global (Est.)</span>
                <span className="font-bold text-indigo-600">
                   {dbStats?.sessions && dbStats?.avgCapacity > 0 
                     ? `${((dbStats.tickets / (dbStats.sessions * dbStats.avgCapacity)) * 100).toFixed(1)}%` 
                     : '-'}
                </span>
             </div>
          </CardContent>
       </Card>
    </div>
  );
}
