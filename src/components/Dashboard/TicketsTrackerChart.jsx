
import React from 'react';
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
import { MousePointerClick } from 'lucide-react';

const COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#9333ea', // purple-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
];

export default function TicketsTrackerChart({ data, selectedEvents, eventNames }) {
  if (!selectedEvents || selectedEvents.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
        <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-full mb-4">
          <MousePointerClick className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun événement sélectionné
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Sélectionnez au moins un événement dans la liste de gauche pour afficher le graphique comparatif des ventes.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        Données insuffisantes pour les événements sélectionnés.
      </div>
    );
  }

  return (
    <div className="h-full w-full animate-in fade-in duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.6} />
          <XAxis 
            dataKey="name"
            stroke="#9ca3af"
            fontSize={12}
            tickMargin={10}
            label={{ 
              value: 'Jours avant J0 (Date de l\'événement)', 
              position: 'insideBottom', 
              offset: -10,
              style: { fill: '#6b7280', fontSize: 12 }
            }}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
            allowDecimals={false}
            label={{ 
              value: 'Billets Cumulés', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
            formatter={(value, name) => [value, eventNames[name] || name]}
            labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '0.25rem' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{eventNames[value] || value}</span>}
          />
          
          {selectedEvents.map((eventId, index) => (
            <Line
              key={eventId}
              type="monotone"
              dataKey={eventId}
              name={eventId}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={true}
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
