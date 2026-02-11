
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getSalesTrendData, getAllEventsForSelector } from '@/lib/dashboardService';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesTrendChart({ selectedEventIds }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventNames, setEventNames] = useState({});

  // Fetch event names for legend mapping
  useEffect(() => {
    async function loadNames() {
      const events = await getAllEventsForSelector();
      const map = {};
      events.forEach(e => map[e.id] = e.name);
      setEventNames(map);
    }
    loadNames();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!selectedEventIds || selectedEventIds.length === 0) {
        setData([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await getSalesTrendData(selectedEventIds);
        setData(result);
      } catch (err) {
        console.error("Failed to load sales trend data", err);
        setError("Impossible de charger les données de tendance des ventes. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedEventIds]);

  if (!selectedEventIds || selectedEventIds.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendance des Ventes</CardTitle>
        <CardDescription>(Progression cumulée des ventes)</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="space-y-4 w-full px-4">
              <Skeleton className="h-[300px] w-full" />
              <div className="flex gap-4 justify-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400 italic">
            Pas assez de données pour afficher le graphique
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => {
                    try {
                        return format(parseISO(str), 'd MMM', { locale: fr });
                    } catch (e) {
                        return str;
                    }
                  }}
                  stroke="#9ca3af"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(val) => Math.floor(val)}
                  allowDecimals={false}
                  label={{ 
                    value: 'Ventes Cumulées', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }
                  }}
                />
                <Tooltip 
                  labelFormatter={(str) => {
                    try {
                        return format(parseISO(str), 'EEEE d MMMM yyyy', { locale: fr });
                    } catch (e) {
                        return str;
                    }
                  }}
                  formatter={(value, name) => [value, `Ventes Cumulées (${name})`]}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {selectedEventIds.map((eventId, index) => (
                  <Line
                    key={eventId}
                    type="monotone"
                    dataKey={eventId}
                    name={eventNames[eventId] || 'Événement'}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    isAnimationActive={true}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
