
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useDarkMode } from '@/contexts/DarkModeContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const EventDistributionChart = ({ data, loading = false }) => {
  const { isDarkMode } = useDarkMode();

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  // Handle empty or undefined data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="text-center">
          <p className="text-gray-500 text-sm dark:text-slate-400">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            stroke={isDarkMode ? "#0f172a" : "#fff"}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, 'Tickets']}
            contentStyle={{ 
                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                borderColor: isDarkMode ? '#334155' : '#e5e7eb',
                color: isDarkMode ? '#f8fafc' : '#020617',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#cbd5e1' : '#374151' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventDistributionChart;
