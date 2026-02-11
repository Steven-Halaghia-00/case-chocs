
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '@/contexts/DarkModeContext';

function ActivityChart({ data }) {
  const { isDarkMode } = useDarkMode();
  // Transform data for chart
  const chartData = data || [];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
          <XAxis 
            dataKey="date" 
            stroke={isDarkMode ? "#94a3b8" : "#6b7280"}
            tick={{ fill: isDarkMode ? "#94a3b8" : "#6b7280" }}
          />
          <YAxis 
            stroke={isDarkMode ? "#94a3b8" : "#6b7280"}
            tick={{ fill: isDarkMode ? "#94a3b8" : "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDarkMode ? '#1e293b' : 'white',
              borderColor: isDarkMode ? '#334155' : '#e5e7eb',
              color: isDarkMode ? '#f8fafc' : '#020617',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ActivityChart;
