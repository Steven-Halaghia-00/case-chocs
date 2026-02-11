
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '@/contexts/DarkModeContext';

const RevenuePerEventChart = ({ data }) => {
  const { isDarkMode } = useDarkMode();
  // Sort by revenue descending
  const sortedData = [...(data || [])].sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: isDarkMode ? "#94a3b8" : "#6b7280" }} 
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: isDarkMode ? "#94a3b8" : "#6b7280" }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip 
            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            formatter={(value) => [`${value.toFixed(2)} €`, 'Revenu']}
            contentStyle={{ 
                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                borderColor: isDarkMode ? '#334155' : '#e5e7eb',
                color: isDarkMode ? '#f8fafc' : '#020617',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
             }}
          />
          <Bar 
            dataKey="total" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenuePerEventChart;
