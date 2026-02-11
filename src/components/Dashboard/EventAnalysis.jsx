
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { getEventAnalysis } from '@/lib/dashboardService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EventAnalysis({ selectedEventIds }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!selectedEventIds || selectedEventIds.length === 0) {
        setData([]);
        return;
      }
      
      setLoading(true);
      const result = await getEventAnalysis(selectedEventIds);
      setData(result);
      setLoading(false);
    }
    
    fetchData();
  }, [selectedEventIds]);

  if (!selectedEventIds || selectedEventIds.length === 0) {
    return (
      <Alert className="bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-800">
        <AlertCircle className="h-4 w-4 text-gray-500" />
        <AlertDescription className="text-gray-500">
          Sélectionnez un ou plusieurs événements ci-dessus pour afficher les statistiques détaillées.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse Détaillée</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucune donnée trouvée pour les événements sélectionnés.</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-900">
                  <TableHead className="w-[300px]">Événement</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                  <TableHead className="text-right">Revenus</TableHead>
                  <TableHead className="text-right">Remplissage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.eventId}>
                    <TableCell className="font-medium">{row.eventName}</TableCell>
                    <TableCell className="text-right">{row.sessions}</TableCell>
                    <TableCell className="text-right">{row.tickets.toLocaleString('fr-CH')}</TableCell>
                    <TableCell className="text-right font-mono text-indigo-600 dark:text-indigo-400">
                      CHF {row.revenue.toLocaleString('fr-CH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${
                          row.fillRate >= 80 ? 'text-green-600' : 
                          row.fillRate >= 50 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {row.fillRate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
